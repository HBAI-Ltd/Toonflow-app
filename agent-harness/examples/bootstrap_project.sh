#!/usr/bin/env bash
# Headless short-drama project bootstrap against the real Toonflow-app backend.
# Zero-cost only (no paid generation). Requires the CLI installed:
#   cd .external-engines/Toonflow-app/agent-harness && pip install -e .
set -euo pipefail

SESS="${1:-/tmp/tf-demo.json}"
CLI="cli-anything-toonflow-app --project $SESS"

cli-anything-toonflow-app session new -o "$SESS"
$CLI server start --mode dev --wait 120
$CLI auth login -u admin -p admin123
$CLI --json project create -n "Demo Drama" --intro "bootstrap example"

PID=$($CLI --json project list | python -c "import sys,json;print(max(p['id'] for p in json.load(sys.stdin)))")
$CLI project use "$PID"

cat > /tmp/chapters.json <<'JSON'
[{"index":1,"reel":"R1","chapter":"Ch1","chapterData":"Once upon a time."},
 {"index":2,"reel":"R1","chapter":"Ch2","chapterData":"The end."}]
JSON
$CLI novel import --file /tmp/chapters.json
$CLI script add -n "S1" --content "INT. ROOM - DAY"
$CLI --json novel list
$CLI --json task list
$CLI db export -o /tmp/tf-backup.json

echo "Done. Session: $SESS  Project id: $PID"
# Paid steps (NOT run here) would be, with explicit consent:
#   $CLI scriptagent chat -m "outline this" --confirm
#   $CLI production generate-image --storyboard-ids 1 --confirm
