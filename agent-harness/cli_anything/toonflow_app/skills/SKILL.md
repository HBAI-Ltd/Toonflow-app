---
name: >-
  cli-anything-toonflow-app
description: >-
  Standalone agent CLI for Toonflow-app — drives its real Express REST +
  Socket.IO backend (novel -> AI animated short-drama factory). Server
  lifecycle, auth, projects, novels, scripts, ScriptAgent chat, production,
  vendors, tasks, DB backup. Paid ops gated behind --confirm.
---

# cli-anything-toonflow-app

A standalone, stateful agent CLI for **Toonflow-app** — an Electron/Express/
TypeScript factory that turns a novel into an AI-generated animated short
drama (策划 → 编剧/ScriptAgent → 分镜/ProductionAgent → 出片). This CLI is a
command-line interface **to** the real Toonflow-app backend; it does NOT
reimplement the pipeline. Every operation calls the real Express REST API
(167 routes) or the Socket.IO ScriptAgent, run by the actual Node backend
in server-only mode (no Electron).

## Installation

```bash
cd .external-engines/Toonflow-app/agent-harness
pip install -e .
# ScriptAgent Socket.IO chat needs the optional client:
pip install -e ".[socket]"
```

**Prerequisites:**
- Python 3.10+
- Node.js >= 18 + the Toonflow-app repo with deps installed
  (`npm install --legacy-peer-deps` — peer-dep conflict: sqlite3 v5 vs v6).
  The server is a hard dependency; `server start` boots it for you.
- Set `TOONFLOW_APP_DIR` if the repo is not an ancestor of the install path.

Verify: `cli-anything-toonflow-app --help`

## Basic Workflow

```bash
# 1. Create a session (stores base URL + token + current project/script ids)
cli-anything-toonflow-app session new -o tf.json

# 2. Boot the real server (server-only mode, no Electron)
cli-anything-toonflow-app --project tf.json server start --mode dev

# 3. Authenticate (default creds admin/admin123) — stores Bearer token
cli-anything-toonflow-app --project tf.json auth login -u admin -p admin123

# 4. Create + select a project, import a novel
cli-anything-toonflow-app --json --project tf.json project create -n "Demo"
cli-anything-toonflow-app --json --project tf.json project list
cli-anything-toonflow-app --project tf.json project use <id>
cli-anything-toonflow-app --project tf.json novel import --file chapters.json

# 5. Inspect (zero cost)
cli-anything-toonflow-app --json --project tf.json task list
cli-anything-toonflow-app --json --project tf.json db export -o backup.json
```

### REPL Mode

With no subcommand the CLI enters an interactive REPL (history, tab-style
prompt). `--json` is honored per command; `help`/`quit` work in-REPL.

```bash
cli-anything-toonflow-app --project tf.json
```

## Command Groups

### server
- `server start [--mode dev|start] [--wait N]` — boot Toonflow-app server-only
- `server stop` — stop a server this CLI started (pidfile-tracked)
- `server status` — zero-cost reachability + api-up probe

### auth
- `auth login -u <user> -p <pass>` — POST /api/login/login, store Bearer token
- `auth whoami` — show base URL / user / current project & script ids

### project
- `project create -n <name> [--intro ... --art-style ... --video-ratio ...]`
- `project list` — POST /api/project/getProject
- `project get [--id N]` — single project (current if --id omitted)
- `project edit --id N [-n ... --intro ... --art-style ...]`
- `project delete --id N --confirm` — cascade delete (destructive -> --confirm)
- `project use <id>` — set current project id in session

### novel
- `novel import --file <chapters.json> [--project-id N]` — POST addNovel
  (JSON file = list of `{index,reel,chapter,chapterData}`)
- `novel list [--page --limit --search]` — POST getNovel
- `novel extract-events --novel-ids 1,2 --confirm` — LLM cleaning pipeline
  (gated: needs **--confirm**)

### script
- `script add -n <name> (--content ... | --file ...) [--assets 1,2]`
- `script list [--name ...]`
- `script export --script-id N`
- `script use <id>` — set current script id
- `script get-plan` / `script set-plan --story-skeleton ... --adaptation-strategy ...`
  (策划: /api/scriptAgent/{get,set}PlanData)

### scriptagent
- `scriptagent chat -m <message> [--think --think-level N] --confirm`
  Socket.IO `/api/socket/scriptAgent`; streams the reply. **PAID LLM call —
  needs --confirm.**

### production
- `production storyboard [--script-id N]` — read-only storyboard data
- `production generate-image --storyboard-ids 1,2 --confirm` — **PAID**
- `production generate-video --upload-data '[{"id":1,"sources":"assets"}]'
  --prompt ... --model ... --mode ... --resolution ... --duration N
  --track-id N --confirm` — **PAID**

### vendor
- `vendor add --file <vendor.ts>` — POST addVendor (compiles+validates the TS)
- `vendor list`
- `vendor set-inputs --id <vendorId> --inputs '{"apiKey":"..."}'`
- `vendor enable --id <vendorId> [--disable]`

### agent
- `agent list` — POST getAgentDeploy
- `agent deploy --id N --name ... --model ... --model-name ... [--vendor-id ...]`

### task (read-only, zero cost)
- `task list [--page --limit --state --task-class --project-id]`
- `task details --task-id N`
- `task categories`

### db
- `db export -o <backup.json>` — GET exportData (full JSON backup)
- `db import --file <backup.json> --confirm` — **DESTRUCTIVE** restore
- `db info` — GET dbInfo (table row counts, read-only)

### session
- `session new -o <file> [--base-url URL]`
- `session info` / `session set <key> <value>` / `session undo` / `session redo`

## Cost Safety (important for agents)

These commands refuse with a non-zero exit unless `--confirm` is passed:
`scriptagent chat`, `novel extract-events`, `production generate-image`,
`production generate-video`, `project delete`, `db import`. Everything else
(login, project/script/task/db read, server status, novel/script create) is
zero-cost. Prefer the zero-cost introspection commands before any `--confirm`.

## For AI Agents

1. **Always use `--json`** for parseable output. Errors are emitted as
   `{"error": "..."}` on stderr with a non-zero exit code.
2. **Pass `--project <session.json>`** on every call so token + current
   project/script persist (auto-saved after one-shot mutations; `--dry-run`
   suppresses the save).
3. **Check return codes** — 0 success, non-zero error.
4. **Order**: `session new` -> `server start` -> `auth login` ->
   `project create`/`use` -> domain commands.
5. **Never call paid/destructive commands without explicit user intent**;
   they require `--confirm`.
6. The Toonflow REST envelope is `{code,data,message}`; the CLI already
   unwraps it and surfaces `code != 200` as an error.

## More Information

- Full docs: `cli_anything/toonflow_app/README.md`
- Test plan & results: `cli_anything/toonflow_app/tests/TEST.md`
- Software SOP: `agent-harness/TOONFLOW_APP.md`
- Methodology: HARNESS.md in the cli-anything plugin

## Version

1.0.0
