"""Trains the pickup-ETA model on the simulated orders and reports how it does.

Compares three models on the same held-out 20% of orders:
  - mean baseline: always predicts the average training prep time
  - linear regression
  - random forest (the one that gets saved and served)

Prints MAE, RMSE, R², the share of predictions within 3 minutes, 5-fold
cross-validated MAE for the forest, and which features it leans on. Writes
ml/metrics-eta.json and ml/models/eta-model.joblib.

The data is SIMULATED (see simulate.py): these numbers measure how well each
model recovers the simulator's formula, not real kitchen times.

Usage:
    python3 ml/simulate.py && python3 ml/train_eta.py
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

try:
    import joblib
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    from sklearn.model_selection import KFold, cross_val_score
except ImportError:
    sys.exit("scikit-learn is missing. Install it with:\n  pip3 install scikit-learn --break-system-packages")

from features import FEATURE_NAMES

ROOT = Path(__file__).resolve().parent
SEED = 42


def load(path):
    with open(path, encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    if not rows:
        sys.exit(f"No rows in {path}; run simulate.py first")
    X = np.array([[float(row[name]) for name in FEATURE_NAMES] for row in rows])
    y = np.array([float(row["prep_minutes"]) for row in rows])
    return X, y


def scores(y_true, y_pred):
    return {
        "mae_min": round(float(mean_absolute_error(y_true, y_pred)), 2),
        "rmse_min": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 2),
        "r2": round(float(r2_score(y_true, y_pred)), 3),
        "within_3_min": round(float(np.mean(np.abs(y_true - y_pred) <= 3)), 3),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", default=str(ROOT / "data" / "simulated_orders.csv"))
    parser.add_argument("--model-out", default=str(ROOT / "models" / "eta-model.joblib"))
    parser.add_argument("--metrics-out", default=str(ROOT / "metrics-eta.json"))
    args = parser.parse_args()

    X, y = load(args.data)
    order = np.random.default_rng(SEED).permutation(len(y))
    split = int(len(y) * 0.8)
    train, test = order[:split], order[split:]

    forest = RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=SEED, n_jobs=-1)
    linear = LinearRegression()
    forest.fit(X[train], y[train])
    linear.fit(X[train], y[train])

    results = {
        "mean baseline": scores(y[test], np.full(len(test), y[train].mean())),
        "linear regression": scores(y[test], linear.predict(X[test])),
        "random forest": scores(y[test], forest.predict(X[test])),
    }
    cv = -cross_val_score(
        RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=SEED, n_jobs=-1),
        X, y, cv=KFold(5, shuffle=True, random_state=SEED), scoring="neg_mean_absolute_error",
    )
    importances = sorted(zip(FEATURE_NAMES, forest.feature_importances_), key=lambda pair: -pair[1])

    print(f"SIMULATED data: {len(train)} training orders, {len(test)} held out\n")
    print(f"{'model':<18} {'MAE':>6} {'RMSE':>6} {'R²':>6} {'±3 min':>7}")
    for name, s in results.items():
        print(f"{name:<18} {s['mae_min']:>6} {s['rmse_min']:>6} {s['r2']:>6} {s['within_3_min']:>7.0%}")
    print(f"\nrandom forest, 5-fold CV MAE: {cv.mean():.2f} ± {cv.std():.2f} min")
    print("\nwhat the forest leans on:")
    for name, weight in importances[:8]:
        print(f"  {name:<22} {weight:.3f}")

    metrics = {
        "data": "SIMULATED (ml/simulate.py)",
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "train_orders": len(train),
        "test_orders": len(test),
        "held_out": results,
        "forest_cv_mae_min": {"mean": round(float(cv.mean()), 2), "std": round(float(cv.std()), 2)},
        "feature_importance": {name: round(float(weight), 4) for name, weight in importances},
    }
    os.makedirs(os.path.dirname(args.model_out), exist_ok=True)
    joblib.dump({"model": forest, "feature_names": FEATURE_NAMES, "metrics": metrics}, args.model_out)
    with open(args.metrics_out, "w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)
        handle.write("\n")
    print(f"\nsaved {args.model_out} and {args.metrics_out}")


if __name__ == "__main__":
    main()
