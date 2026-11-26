#!/usr/bin/env bash
set -euo pipefail

repo=${1:-.}
url=${VERIFY_URL:-http://127.0.0.1:5173/}
expected=$(cd "$repo" && pwd -P)

status=$(curl -sS -o /dev/null -w '%{http_code}' "$url")

if [[ "$status" != "200" ]]; then
  echo "FAIL: $url returned $status"
  exit 1
fi

pid=$(lsof -nP -iTCP:5173 -sTCP:LISTEN -t | head -1 || true)

if [[ -z "$pid" ]]; then
  echo "FAIL: no process owns port 5173"
  exit 1
fi

cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1 || true)

if [[ "$cwd" != "$expected" ]]; then
  echo "FAIL: port 5173 is owned by $cwd, expected $expected"
  exit 1
fi

version=$(node -p "require('$expected/node_modules/genosdb/package.json').version")

echo "OK: $url ($status), port owned by $cwd, genosdb $version"
