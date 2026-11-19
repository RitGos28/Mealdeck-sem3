"""Serves the trained ETA model on localhost for the Spring backend.

    POST /predict  {"items": [{"name", "category", "quantity"}], "hour": 12,
                    "weekday": 1, "ordersAhead": 3, "slotLoad": 4}
                -> {"minutes": 11.2, "low": 9.0, "high": 13.6, "simulated": true}
    GET  /health   -> {"ok": true, "metrics": {...}}

low/high are the 10th and 90th percentiles of the forest's individual trees,
a rough spread rather than a calibrated interval. Standard library only
besides the model itself; listens on 127.0.0.1 so nothing outside this
machine can reach it.

Usage:
    python3 ml/serve_eta.py [--port 8099]
"""

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np

try:
    import joblib
except ImportError:
    sys.exit("scikit-learn is missing. Install it with:\n  pip3 install scikit-learn --break-system-packages")

from features import order_features

ROOT = Path(__file__).resolve().parent
MAX_BODY = 64 * 1024
MAX_ITEMS = 50


def parse(body):
    """The request's features, or raises ValueError with a reason."""
    items = body.get("items")
    if not isinstance(items, list) or not 0 < len(items) <= MAX_ITEMS:
        raise ValueError(f"items must be a list of 1-{MAX_ITEMS} dishes")
    clean = []
    for item in items:
        quantity = item.get("quantity") if isinstance(item, dict) else None
        if not isinstance(quantity, int) or not 0 < quantity <= 50:
            raise ValueError("each item needs a quantity from 1 to 50")
        clean.append({"name": str(item.get("name") or ""), "category": str(item.get("category") or ""),
                      "quantity": quantity})

    def bounded(key, low, high):
        value = body.get(key)
        if not isinstance(value, int) or not low <= value <= high:
            raise ValueError(f"{key} must be a whole number from {low} to {high}")
        return value

    return order_features(clean, bounded("hour", 0, 23), bounded("weekday", 0, 6),
                          bounded("ordersAhead", 0, 500), bounded("slotLoad", 0, 500))


def make_handler(bundle):
    forest = bundle["model"]

    class Handler(BaseHTTPRequestHandler):
        def _reply(self, status, payload):
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _reject(self, reason):
            sys.stderr.write(f"eta rejected a request: {reason}\n")
            self._reply(400, {"error": reason})

        def do_GET(self):
            if self.path == "/health":
                self._reply(200, {"ok": True, "metrics": bundle["metrics"]})
            else:
                self._reply(404, {"error": "not found"})

        def do_POST(self):
            if self.path != "/predict":
                self._reply(404, {"error": "not found"})
                return
            length = int(self.headers.get("Content-Length") or 0)
            if not 0 < length <= MAX_BODY:
                self._reject("send a JSON body with a Content-Length, at most 64 KB")
                return
            try:
                row = np.array([parse(json.loads(self.rfile.read(length)))], dtype=float)
            except (ValueError, AttributeError) as error:
                self._reject(str(error))
                return
            per_tree = np.array([tree.predict(row)[0] for tree in forest.estimators_])
            self._reply(200, {
                "minutes": round(float(forest.predict(row)[0]), 1),
                "low": round(float(np.percentile(per_tree, 10)), 1),
                "high": round(float(np.percentile(per_tree, 90)), 1),
                "simulated": True,
            })

        def log_message(self, format, *args):
            sys.stderr.write(f"eta {self.address_string()} {format % args}\n")

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", default=str(ROOT / "models" / "eta-model.joblib"))
    parser.add_argument("--port", type=int, default=8099)
    # 127.0.0.1 on a laptop; 0.0.0.0 inside the demo's container, where only
    # the demo's private Docker network can reach it.
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    if not Path(args.model).exists():
        sys.exit(f"No model at {args.model}; run simulate.py then train_eta.py first")
    bundle = joblib.load(args.model)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(bundle))
    held_out = bundle["metrics"]["held_out"]["random forest"]
    print(f"ETA model on http://{args.host}:{args.port} (SIMULATED data, held-out MAE {held_out['mae_min']} min)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
