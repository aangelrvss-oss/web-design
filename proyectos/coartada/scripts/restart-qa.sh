#!/bin/sh
# Rebuild and restart the production server for local QA (pid in qa-out/server.pid).
mkdir -p qa-out
[ -f qa-out/server.pid ] && kill "$(cat qa-out/server.pid)" 2>/dev/null
npm run build >/dev/null 2>&1 || { echo "build failed"; exit 1; }
PORT=${PORT:-4100} HOST=127.0.0.1 nohup node dist/server.mjs > qa-out/server.log 2>&1 &
echo $! > qa-out/server.pid
sleep 1.2
curl -fsS "http://127.0.0.1:${PORT:-4100}/healthz" && echo
