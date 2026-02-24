# Vivido-app Local Deploy Report

Date: 2026-02-24

## Status

Partial success (Node path successful; Docker path blocked in current WSL runtime).

## Access

- Backend URL: `http://127.0.0.1:60000`
- Login endpoint: `POST /other/login`
- Default credentials: `admin` / `admin123`

## Verification

- Login check returned HTTP 200 with token.
- Token-authenticated endpoint check returned HTTP 200 (`POST /setting/getSetting`).

## Executed Commands (core)

```bash
git clone https://github.com/HBAI-Ltd/Toonflow-app.git projects/toonflow-app-demo
source ~/.nvm/nvm.sh && nvm use 22
yarn install --frozen-lockfile --network-timeout 120000
yarn build
NODE_ENV=prod node build/app.js
```

Current keepalive launch (main session):

```bash
cd /home/linchance/.openclaw/workspace/projects/toonflow-app-demo
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
NODE_ENV=prod nohup node build/app.js > /tmp/toonflow-app.log 2>&1 &
```

## Blockers / Environment Gaps

1. Docker unavailable in current WSL context:
   - `docker: command not found`
   - `docker-compose: command not found`
2. PM2 unavailable:
   - `pm2: command not found`

## Human Help Needed (only if Docker path is required)

- Install Docker Desktop + enable WSL integration (or install Docker Engine in WSL).
- Ensure `docker` and `docker compose` are available in this shell.

## Recommendation

- For immediate local demo: continue with Node path (already running).
- For stable team/demo packaging: add Docker-on-WSL as next step.
