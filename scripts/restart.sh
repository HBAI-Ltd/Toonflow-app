#!/usr/bin/env bash
set -eu

scriptDir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
"$scriptDir/stop.sh"
"$scriptDir/start.sh"
