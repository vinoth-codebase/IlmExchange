#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$ROOT_DIR/../.node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "[IlmExchange] Starting TU Ilmenau Peer Marketplace & Web Component Library..."

cleanup() {
  echo ""
  echo "[IlmExchange] Shutting down services..."
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM

# Free any stale processes occupying port 3000 or 5173
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

cd "$ROOT_DIR/backend"
if [ ! -d "node_modules" ]; then
  echo "[IlmExchange] Installing backend dependencies..."
  npm install
fi

echo "[IlmExchange] Launching Express SQLite Backend on http://localhost:3000..."
npm run dev &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "[IlmExchange] Installing frontend dependencies..."
  npm install
fi

echo "[IlmExchange] Launching React + Lit Vite Host on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
