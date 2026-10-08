#!/usr/bin/env bash
set -eu

repoDir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
pidFile="$repoDir/.toonflow-dev.pid"

if [[ ! -f "$pidFile" ]]; then
  echo "Toonflow 未运行。"
  exit 0
fi

read -r pid processGroup < "$pidFile"
rm -f "$pidFile"
if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! kill -0 "$pid" 2>/dev/null; then
  echo "Toonflow 未运行。"
  exit 0
fi

stopTree() {
  local target="$1"
  local child
  while read -r child; do
    [[ "$child" =~ ^[0-9]+$ ]] && stopTree "$child"
  done < <(pgrep -P "$target" 2>/dev/null || true)
  kill "$target" 2>/dev/null || true
}

stopTree "$pid"
currentGroup="$(ps -o pgid= -p $$ 2>/dev/null | tr -d ' ')"
if [[ "${processGroup:-}" =~ ^[0-9]+$ && "$processGroup" != "$currentGroup" && "$processGroup" != "0" ]]; then
  /bin/kill -TERM -"$processGroup" 2>/dev/null || true
fi
for _ in {1..20}; do
  kill -0 "$pid" 2>/dev/null || { echo "Toonflow 已停止。"; exit 0; }
  sleep 0.25
done

/bin/kill -KILL -"$processGroup" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
echo "Toonflow 已停止。"
