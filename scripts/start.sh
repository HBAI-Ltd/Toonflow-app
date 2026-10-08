#!/usr/bin/env bash
set -eu

repoDir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
pidFile="$repoDir/.toonflow-dev.pid"
logFile="$repoDir/logs/toonflow-dev.log"

if [[ -f "$pidFile" ]]; then
  read -r pid processGroup < "$pidFile"
  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Toonflow 已在运行，PID: $pid"
    exit 0
  fi
  rm -f "$pidFile"
fi

if [[ -n "${BUN_BIN:-}" ]]; then
  bunBin="$BUN_BIN"
elif command -v bun >/dev/null 2>&1; then
  bunBin="$(command -v bun)"
else
  bunBin=""
  for candidate in "$HOME/.bun/bin/bun" "$HOME/.cherrystudio/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
    if [[ -x "$candidate" ]]; then
      bunBin="$candidate"
      break
    fi
  done
fi

if [[ -z "$bunBin" || ! -x "$bunBin" ]]; then
  echo "未找到 Bun，请先安装 Bun 1.3.14 并确保 bun 在 PATH 中。" >&2
  exit 1
fi
export PATH="$(dirname "$bunBin"):$PATH"

mkdir -p "$(dirname "$logFile")"
(
  /usr/bin/perl -MPOSIX -e 'POSIX::setsid() or die $!; exec @ARGV or die $!' \
    "$repoDir/scripts/runDev.sh" "$repoDir" "$bunBin"
) >>"$logFile" 2>&1 < /dev/null &
pid=$!
printf '%s\n' "$pid" > "$pidFile"

probeUrl() {
  "$bunBin" -e 'const response = await fetch(process.argv[1]).catch(() => undefined); process.exit(response ? 0 : 1)' "$1" >/dev/null 2>&1
}

ready=false
for _ in {1..30}; do
  if ! kill -0 "$pid" 2>/dev/null; then break; fi
  if probeUrl "http://127.0.0.1:3000" && probeUrl "http://127.0.0.1:5173"; then
    ready=true
    break
  fi
  sleep 0.5
done

if [[ "$ready" != true ]]; then
  echo "Toonflow 启动失败，最近日志：" >&2
  tail -n 30 "$logFile" >&2 || true
  "$repoDir/scripts/stop.sh" >/dev/null 2>&1 || true
  rm -f "$pidFile"
  exit 1
fi
processGroup="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
if [[ "$processGroup" =~ ^[0-9]+$ ]]; then
  printf '%s %s\n' "$pid" "$processGroup" > "$pidFile"
fi

echo "Toonflow 已启动，PID: $pid"
echo "前端地址: http://127.0.0.1:5173"
echo "后端地址: http://127.0.0.1:3000"
echo "日志: $logFile"
