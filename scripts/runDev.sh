#!/usr/bin/env bash
set -eu

repoDir="$1"
bunBin="$2"
cd "$repoDir"

"$bunBin" run --cwd apps/web dev &
webPid=$!
"$bunBin" run --cwd apps/server dev &
serverPid=$!
trap 'kill "$webPid" "$serverPid" 2>/dev/null || true; wait "$webPid" 2>/dev/null || true; wait "$serverPid" 2>/dev/null || true' TERM INT EXIT
wait "$webPid" 2>/dev/null || true
wait "$serverPid" 2>/dev/null || true
