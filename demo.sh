#!/usr/bin/env bash
# One command for the local showcase demo: the ETA model server, the backend
# with simulated history and every real menu, and a production build of the
# frontend. Prints the links for this Mac and for a phone on the same network.
#
#   ./demo.sh            start everything (stops a previous run first)
#   ./demo.sh public     the same, and also serve it at https://demo.mealdeck.in
#                        through a Cloudflare tunnel named "mealdeck-demo"
#                        (needs `brew install cloudflared` and, once,
#                        `cloudflared tunnel login`; creates the tunnel and
#                        its DNS record the first time). Admin password login
#                        is off in this mode: the demo is open to anyone.
#   ./demo.sh public --no-tunnel
#                        public settings, but no tunnel here: another machine's
#                        cloudflared forwards demo.mealdeck.in to this one
#                        (e.g. over Tailscale: /api/ -> <this Mac>:8080,
#                        everything else -> <this Mac>:3000).
#   ./demo.sh stop       stop everything
#   ./demo.sh status     what's running, and the links
#
# Needs: Java 21, Node, python3 with scikit-learn (pip3 install scikit-learn
# --break-system-packages), and the menu CSVs (MENU_DIR, below). Logs go to
# .demo/ in this folder. Works offline except dish photos; if the venue's
# Wi-Fi blocks phone-to-laptop traffic, join both to a phone hotspot and run
# ./demo.sh again so it picks up the hotspot's address.
set -uo pipefail
cd "$(dirname "$0")"
ROOT="$PWD"
STATE="$ROOT/.demo"
MENU_DIR="${MENU_DIR:-$ROOT/menu}"
mkdir -p "$STATE"

lan_ip() {
  for i in en0 en1 en2 bridge100; do ip=$(ipconfig getifaddr "$i" 2>/dev/null) && [ -n "$ip" ] && { echo "$ip"; return; }; done
  echo "127.0.0.1"
}

port_pid() { lsof -tnP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -1; }

TUNNEL=mealdeck-demo
PUBLIC_HOST=demo.mealdeck.in

stop_all() {
  for f in tunnel eta backend frontend; do
    if [ -f "$STATE/$f.pid" ]; then kill "$(cat "$STATE/$f.pid")" 2>/dev/null; rm -f "$STATE/$f.pid"; fi
  done
  # Anything still holding the demo's ports (e.g. started by hand earlier).
  for p in 8099 8080 3000; do pid=$(port_pid $p); [ -n "$pid" ] && kill "$pid" 2>/dev/null; done
  sleep 2
  for p in 8099 8080 3000; do pid=$(port_pid $p); [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null; done
  echo "Demo stopped."
}

links() {
  local ip; ip=$(lan_ip)
  echo
  [ "${PUBLIC:-0}" = 1 ] && echo "  Public:       https://$PUBLIC_HOST   (QR code: https://$PUBLIC_HOST/?src=qr)"
  echo "  On this Mac:  http://localhost:3000"
  echo "  On a phone:   http://$ip:3000   (same Wi-Fi or hotspot)"
  echo "  Logins:       student@bennett.edu.in / student123   ·   bistro@mealdeck.in / vendor123 (at /vendor/login)"
  echo "  Note:         Bistro / Kathi is the pre-order preview (dishes have +); open dishes at Quench, SnapEats, ... for the details sheet."
  printf 'http://%s:3000' "$ip" | pbcopy 2>/dev/null && echo "  (phone link copied to the clipboard)"
}

status() {
  for p in 8099:model 8080:backend 3000:frontend; do
    if [ -n "$(port_pid "${p%%:*}")" ]; then echo "  ${p##*:} (port ${p%%:*}): running"; else echo "  ${p##*:} (port ${p%%:*}): stopped"; fi
  done
  links
}

wait_for() { # url name seconds
  for _ in $(seq 1 "$3"); do curl -fs -o /dev/null --max-time 3 "$1" 2>/dev/null && { echo "  $2 ready"; return 0; }; sleep 1; done
  echo "  $2 did NOT come up in $3 s: see $STATE/$2.log"; return 1
}

PUBLIC=0
OWN_TUNNEL=0
case "${1:-start}" in
  stop) stop_all; exit 0 ;;
  status) status; exit 0 ;;
  start) ;;
  public) PUBLIC=1; [ "${2:-}" = "--no-tunnel" ] || OWN_TUNNEL=1 ;;
  *) echo "Usage: $0 [start|public [--no-tunnel]|stop|status]"; exit 2 ;;
esac

if [ "$OWN_TUNNEL" = 1 ]; then
  command -v cloudflared > /dev/null || { echo "Install cloudflared first: brew install cloudflared"; exit 1; }
  [ -f "$HOME/.cloudflared/cert.pem" ] || { echo "Log in to Cloudflare once first: cloudflared tunnel login"; exit 1; }
  TUNNEL_ID=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "import json,sys; print(next((t['id'] for t in json.load(sys.stdin) if t['name']=='$TUNNEL'), ''))")
  if [ -z "$TUNNEL_ID" ]; then
    echo "Creating the Cloudflare tunnel $TUNNEL and $PUBLIC_HOST (first time only)..."
    cloudflared tunnel create "$TUNNEL" > "$STATE/tunnel-create.log" 2>&1 || { echo "  tunnel create failed: see $STATE/tunnel-create.log"; exit 1; }
    TUNNEL_ID=$(cloudflared tunnel list --output json | python3 -c "import json,sys; print(next(t['id'] for t in json.load(sys.stdin) if t['name']=='$TUNNEL'))")
    cloudflared tunnel route dns "$TUNNEL" "$PUBLIC_HOST" >> "$STATE/tunnel-create.log" 2>&1 || { echo "  DNS route failed: see $STATE/tunnel-create.log"; exit 1; }
  fi
  # /api (and its WebSocket) straight to the backend, everything else to Next.js.
  cat > "$STATE/tunnel.yml" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json
ingress:
  - hostname: $PUBLIC_HOST
    path: ^/api/
    service: http://localhost:8080
  - hostname: $PUBLIC_HOST
    service: http://localhost:3000
  - service: http_status:404
EOF
fi

python3 -c "import sklearn" 2>/dev/null || { echo "scikit-learn is missing: pip3 install scikit-learn --break-system-packages"; exit 1; }
[ -d "$MENU_DIR" ] || { echo "No menu CSVs at $MENU_DIR (set MENU_DIR=...)"; exit 1; }
JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null)" || { echo "Java 21 not found"; exit 1; }
export JAVA_HOME

stop_all > /dev/null
IP=$(lan_ip)
echo "Starting the MealDeck demo (network address $IP)..."

# 1. The ETA model (trains it first if there's no saved model yet).
if [ ! -f ml/models/eta-model.joblib ]; then
  echo "  training the ETA model (no saved model yet)..."
  (cd ml && python3 simulate.py --menu-dir "$MENU_DIR" && python3 train_eta.py) > "$STATE/train.log" 2>&1 || { echo "  training failed: see $STATE/train.log"; exit 1; }
fi
(cd ml && exec python3 serve_eta.py) > "$STATE/eta.log" 2>&1 &
echo $! > "$STATE/eta.pid"

# 2. The backend: demo profile, simulated history, every real menu, ETA on.
ADMIN_PASSWORD_LOGIN=true
[ "$PUBLIC" = 1 ] && ADMIN_PASSWORD_LOGIN=false
(cd backend && SPRING_PROFILES_ACTIVE=demo ML_ETA_ENABLED=true DEMO_HISTORY=true DEMO_MENU_DIR="$MENU_DIR" RESEND_API_KEY= \
  MEALDECK_ADMIN_PASSWORDLOGIN=$ADMIN_PASSWORD_LOGIN \
  WS_ALLOWED_ORIGINS="https://$PUBLIC_HOST,https://mealdeck.in,http://localhost:*,http://127.0.0.1:*,http://$IP:*" exec ./mvnw -q spring-boot:run) > "$STATE/backend.log" 2>&1 &
echo $! > "$STATE/backend.pid"

# 3. The frontend: a production build that opens the live queue on this Mac's address.
echo "  building the frontend (about a minute)..."
# Public: the live queue uses the page's own address (the tunnel carries
# /api/ws to the backend). Local only: straight at this Mac's backend.
WS_URL="ws://$IP:8080/api/ws"
[ "$PUBLIC" = 1 ] && WS_URL=""
(cd frontend && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && NEXT_PUBLIC_WS_URL="$WS_URL" npm run build) \
  > "$STATE/build.log" 2>&1 || { echo "  frontend build failed: see $STATE/build.log"; exit 1; }
(cd frontend && exec npx next start -H 0.0.0.0 -p 3000) > "$STATE/frontend.log" 2>&1 &
echo $! > "$STATE/frontend.pid"

wait_for http://127.0.0.1:8099/health model 30 || exit 1
wait_for http://127.0.0.1:8080/api/stalls backend 180 || exit 1
wait_for http://127.0.0.1:3000/ frontend 60 || exit 1
seeded=$(grep -o 'SIMULATED demo history: .*' "$STATE/backend.log" | head -1)
[ -n "$seeded" ] && echo "  $seeded"
if [ "$OWN_TUNNEL" = 1 ]; then
  cloudflared tunnel --no-autoupdate --config "$STATE/tunnel.yml" run "$TUNNEL" > "$STATE/tunnel.log" 2>&1 &
  echo $! > "$STATE/tunnel.pid"
fi
if [ "$PUBLIC" = 1 ]; then
  wait_for "https://$PUBLIC_HOST/api/demo-info" "public site" 60 || echo "  ($PUBLIC_HOST isn't answering yet: check the tunnel)"
fi
echo "Demo is up."
links
