# TEST.md — cli-anything-toonflow-app

## Part 1: Test Plan (written before implementation)

### Test Inventory Plan

- `test_core.py`: ~30 unit tests (synthetic data, mocked HTTP/Socket — NO real
  server). Covers session state/undo/redo/locking, the ToonflowClient envelope
  parsing, every core domain module against a mocked client, and cost gating.
- `test_full_e2e.py`: ~10 E2E + subprocess tests. Boots the REAL Toonflow-app
  server in server-only mode and exercises ONLY zero-cost paths
  (login, project CRUD, getProject, task list, db info/export, server status).
  Subprocess class uses `_resolve_cli`. Paid generation is never invoked.

### Unit Test Plan (`test_core.py`)

- `session.py`: new/load/save round-trip; `set` marks modified; undo/redo
  restores state; `_locked_save_json` writes valid JSON atomically; singleton.
- `toonflow_app_backend.ToonflowClient`: `_parse` unwraps `{code:200,data}`,
  raises on `code!=200`, handles non-JSON; `login` stores token; URLError →
  ToonflowError with actionable message. `find_toonflow_repo` via env.
- `api.py`: `require_project`/`require_script` raise when unset; client built
  from session uses base_url+token; requires auth.
- `auth.py`: login stores token+username (mocked client).
- `project.py`: create merges defaults; list normalizes; edit fills missing
  fields from current; delete clears current id; use sets id.
- `novel.py`: import normalizes chapter shape; extract-events builds body.
- `script.py`: add body shape; get/set plan bodies.
- `production.py`: generate_image/video RAISE without `confirmed=True`;
  storyboard is read-only.
- `db.py`: import RAISES without confirm; export writes file + lists tables.
- Cost gating: every gated module call refuses without confirmation.

### E2E Plan (`test_full_e2e.py`)

Real workflow scenarios (zero cost only):

1. **Server boot + reachability** — start server-only mode, `server status`
   shows reachable + api_up.
2. **Auth round-trip** — `auth login admin/admin123` returns a Bearer token;
   `whoami` reflects it.
3. **Project CRUD** — create a project, list shows it, get returns it, edit
   changes intro, delete (confirmed) removes it; list no longer shows it.
4. **Novel import + list** — import 2 synthetic chapters into a project,
   `novel list` returns 2 rows (no event extraction — that is paid/gated).
5. **Task + DB read** — `task list`, `task categories`, `db info`, `db export`
   to a file; verify file is valid JSON with a `tables` map.
6. **Subprocess workflow** (`TestCLISubprocess`, `_resolve_cli`) — full
   session new → server status → login → project create → list → task list,
   all via the installed binary, `--json` parsed.
7. **Cost-safety** — `scriptagent chat` / `production generate-image` /
   `db import` without `--confirm` exit non-zero and never hit a paid API.

### Realistic Workflow Scenario

- **Name**: "Headless short-drama project bootstrap"
- **Simulates**: an agent standing up a Toonflow project from scratch without
  the Electron GUI.
- **Operations chained**: session new → server start → auth login → project
  create → project use → novel import → script add → task list → db export.
- **Verified**: each REST call returns `code 200`; project appears in list;
  novel rows persisted; exported backup is valid JSON containing `o_project`.

---

## Part 2: Test Results (appended after execution)

Environment: Windows 11, Python 3.14.5, pytest 9.0.3. Toonflow-app deps
installed via `npm install --legacy-peer-deps` (803 packages, native
`better-sqlite3` built). Server booted in-env via `tsx src/app.ts`
(server-only, no Electron) on `http://localhost:10588`.

Command: `CLI_ANYTHING_FORCE_INSTALLED=1 python -m pytest
cli_anything/toonflow_app/tests/ -v --tb=no`

```
collected 50 items

test_core.py::TestSession ............................ 7/7 PASSED
test_core.py::TestClientParsing ..................... 6/6 PASSED
test_core.py::TestApiHelpers ........................ 4/4 PASSED
test_core.py::TestAuth .............................. 2/2 PASSED
test_core.py::TestProject ........................... 5/5 PASSED
test_core.py::TestNovel ............................. 2/2 PASSED
test_core.py::TestScript ............................ 2/2 PASSED
test_core.py::TestProductionGating .................. 4/4 PASSED
test_core.py::TestVendorAgentTask ................... 4/4 PASSED
test_core.py::TestDb ................................ 3/3 PASSED
test_full_e2e.py::TestRealServerWorkflow ............ 6/6 PASSED  (real server)
test_full_e2e.py::TestCLISubprocess ................. 5/5 PASSED  (installed binary)

============================= 50 passed in 20.28s =============================
```

`[_resolve_cli] Using installed command:
C:\Users\alfar\AppData\Local\Programs\Python\Python314\Scripts\cli-anything-toonflow-app.EXE`
— subprocess + real-server tests ran against the installed binary.

### Summary Statistics

- Total: 50 tests, 50 passed, 0 failed, 0 skipped (100% pass rate)
- Unit (`test_core.py`): 39 — synthetic data, fully mocked HTTP (no server)
- E2E (`test_full_e2e.py`): 11 — 6 against the REAL Toonflow-app server
  (login, project CRUD, novel import, task/db read, cost-safety), 5 installed-
  binary subprocess tests (help, groups, session JSON, dry-run/auto-save,
  actionable unreachable error)
- Execution time: ~20s
- Real artifacts produced & inspected: project rows in `data/db2.sqlite`,
  novel chapters, a 237,959-byte DB JSON backup.

### Bugs found & fixed during testing

1. `project.delete` used `sess.update(project_id=None)` but `Session.update`
   skips `None` values → current project id was never cleared on delete.
   Fixed to use `sess.set("project_id", None)`.
2. `db.info` initially used POST; Toonflow's `dbInfo` route is a GET (like
   `exportData`). Fixed to GET.
3. Backend `server_start` failed on Windows with `WinError 2` resolving
   `npm`/`yarn` shims. Rewrote `_server_command` to prefer the local
   `node_modules/.bin/tsx src/app.ts` (server-only) with `.cmd` shell
   handling fallback.

### Coverage Notes / Gaps

- `scriptagent chat` (Socket.IO) is exercised only for its cost-gate refusal.
  A real chat run is a PAID LLM call requiring a configured vendor + API key
  and `--confirm`; it is intentionally NOT run in tests (cost safety).
- `production generate-image` / `generate-video` and `novel extract-events`:
  cost-gate refusals are tested; the paid happy-paths are not run by design.
- E2E server boot is automatic in `server_up` fixture; if Node/yarn is
  unavailable it xfail's with the exact human step (documented in
  `test_full_e2e.HUMAN_STEP`). In this environment the server booted
  successfully so no xfail was needed.
- Electron-only routes (`fileManagement/openFolder`, native dialogs, first-
  launch migration) are intentionally out of scope (not headless-drivable).
