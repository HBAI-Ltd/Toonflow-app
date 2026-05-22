# cli-anything-toonflow-app

A standalone, stateful agent CLI for **Toonflow-app** — an Electron/Express/
TypeScript factory that turns a novel into an AI-generated animated short drama
(策划 → 编剧/ScriptAgent → 分镜/ProductionAgent → 出片). This CLI is a
command-line interface **to** the real Toonflow-app backend; it does not
reimplement the pipeline. Every operation calls the real Express REST API
(167 routes) or the Socket.IO ScriptAgent. The pipeline runs inside the actual
Node backend.

## How it works

Toonflow-app runs as a normal Node web server (no Electron needed) on
`http://localhost:10588`. Auth is `POST /api/login/login` → a `Bearer` token
used on every other route. This CLI:

- starts/stops/probes that server (`server` group)
- logs in and stores the token in a JSON session (`auth` group)
- drives projects, novels, scripts, the ScriptAgent (Socket.IO), production,
  vendors, agent deployment, tasks, and DB backup/restore

## Install the software dependency (Toonflow-app)

Toonflow-app is a **hard dependency** (Node.js ≥ 18). From the repo root
(`.external-engines/Toonflow-app`):

```bash
# yarn is the declared package manager; npm also works
npm install --legacy-peer-deps   # (peer-dep conflict: sqlite3 v5 vs v6)
# then either:
npx yarn dev        # server-only, tsx src/app.ts  -> :10588
# or:
npx yarn build && npx yarn start # node data/serve/app.js
# or Docker (see repo Dockerfile)
```

The CLI can do this for you: `cli-anything-toonflow-app server start`.
Set `TOONFLOW_APP_DIR` if the repo is not an ancestor of the install path.

## Install the CLI

```bash
cd .external-engines/Toonflow-app/agent-harness
pip install -e .
# ScriptAgent chat needs the optional Socket.IO client:
pip install -e ".[socket]"
```

Verify:

```bash
which cli-anything-toonflow-app   # (where on Windows)
cli-anything-toonflow-app --help
```

## Basic usage

```bash
# 1. Create a session (stores base URL + token + current ids)
cli-anything-toonflow-app session new -o tf.json

# 2. Boot the real server (server-only mode)
cli-anything-toonflow-app --project tf.json server start --mode dev

# 3. Authenticate
cli-anything-toonflow-app --project tf.json auth login -u admin -p admin123

# 4. Create + select a project
cli-anything-toonflow-app --project tf.json project create -n "Demo"
cli-anything-toonflow-app --project tf.json project list
cli-anything-toonflow-app --project tf.json project use <id>

# 5. Import a novel, list tasks, etc.
cli-anything-toonflow-app --project tf.json novel import --file chapters.json
cli-anything-toonflow-app --json --project tf.json task list
```

REPL mode (default with no subcommand):

```bash
cli-anything-toonflow-app --project tf.json
```

## Cost safety

Paid / destructive operations are gated behind an explicit `--confirm`:

- `scriptagent chat` (LLM call)
- `novel extract-events` (LLM cleaning pipeline)
- `production generate-image`, `production generate-video` (paid media models)
- `project delete` (cascade delete), `db import` (destructive restore)

Zero-cost paths (login, project/script/task/db read, server status) need no
confirmation and are what the test suite exercises.

## State, JSON, auto-save

- Session JSON holds `base_url`, `token`, `username`, `project_id`,
  `script_id`, `isolation_key`. Undo/redo (50 levels), atomic locked saves.
- `--json` on any command emits machine-readable JSON.
- One-shot mutating commands auto-save the session; `--dry-run` suppresses it.

## Run tests

```bash
cd .external-engines/Toonflow-app/agent-harness
pip install -e ".[test]"
python -m pytest cli_anything/toonflow_app/tests/ -v
# Force the installed binary for subprocess tests:
CLI_ANYTHING_FORCE_INSTALLED=1 python -m pytest cli_anything/toonflow_app/tests/ -v -s
```

See `cli_anything/toonflow_app/tests/TEST.md` for the test plan and results.
