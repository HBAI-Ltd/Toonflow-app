# TOONFLOW_APP.md — cli-anything SOP for Toonflow-app

## Phase 1: Codebase Analysis (verified)

- **Backend engine**: Express 5 + Socket.IO server in `src/app.ts`. Electron is
  optional packaging only; `if (!isElectron) startServe()` runs the same server
  headless. Port `10588` (override via `PORT`). Static frontend at
  `data/web/index.html`.
- **Data model**: SQLite at `data/db2.sqlite` (knex). Tables `o_project`,
  `o_novel`, `o_script`, `o_agentWorkData`, `o_storyboard`, `o_assets`,
  `o_tasks`, `o_vendorConfig`, `o_agentDeploy`, `o_user`, `o_setting`. Created
  on first boot via `src/lib/initDB`. Vendors are TypeScript files under
  `data/vendor/{id}.ts`.
- **GUI → API mapping**: `src/router.ts` mounts 167 routes under `/api/...`.
  All are `POST` except `GET /api/setting/dbConfig/exportData`. Global auth
  middleware: only `/api/login/login` is whitelisted; everything else needs
  `Authorization: <token>` (token from login is already `"Bearer ..."`).
  Response envelope: `{code, data, message}` (`code !== 200` → error).
- **Socket.IO**: namespaces `/api/socket/scriptAgent` and
  `/api/socket/productionAgent`. Handshake `auth = {token, isolationKey,
  projectId, scriptId}`. Client emits `chat {content}`, `stop`,
  `updateThinkConfig {think,thinkLevel}` (legacy alias `thinlLevel` still
  accepted). Server emits `message`,
  `content:add`, `content:update`, `message:update {status}`.
- **Electron-only bits (NOT driven)**: `setting/fileManagement/openFolder`,
  first-launch native data migration, native dialogs. Everything else is
  REST/Socket-drivable headless.

## Phase 2: CLI Architecture

Command groups map to Toonflow's real domains:

| Group | Backend surface | Cost |
|-------|-----------------|------|
| `server` | `yarn dev`/`yarn start` lifecycle, port probe | none |
| `auth` | `POST /api/login/login` | none |
| `project` | `/api/project/{addProject,getProject,editProject,delProject}` | none (delete destructive→confirm) |
| `novel` | `/api/novel/{addNovel,getNovel}`, `/event/generateEvents` | extract-events = LLM → confirm |
| `script` | `/api/script/{addScript,getScrptApi,exportScript}`, `/api/scriptAgent/{get,set}PlanData` | none |
| `scriptagent` | Socket.IO `/api/socket/scriptAgent` chat | LLM → confirm |
| `production` | `/api/production/storyboard/getStoryboardData`, `…/batchGenerateImage`, `…/workbench/generateVideo` | image/video paid → confirm |
| `vendor` | `/api/setting/vendorConfig/{addVendor,getVendorList,updateVendorInputs,enableVendor}` | none |
| `agent` | `/api/setting/agentDeploy/{getAgentDeploy,deployAgentModel}` | none |
| `task` | `/api/task/{getTaskApi,taskDetails,getTaskCategories}` | none |
| `db` | `GET …/exportData`, `POST …/importData`, `dbInfo` | import destructive → confirm |
| `session` | local JSON state, undo/redo | none |

State model: JSON session `{base_url, token, username, project_id, script_id,
isolation_key}`; undo/redo (50); atomic locked save; auto-save after one-shot
mutations; `--dry-run` to suppress. Dual output via `--json`. REPL is default.

## Phase 3+: Implementation

`cli_anything/toonflow_app/` — `core/` (one module per domain),
`utils/toonflow_app_backend.py` (HTTP client + server lifecycle, the real
software integration), `utils/repl_skin.py` (copied from plugin). The CLI never
reimplements the pipeline; it issues REST/Socket calls and the Node backend
does the work.

## Cost-safety contract

`--confirm` is required for: `scriptagent chat`, `novel extract-events`,
`production generate-image`, `production generate-video`, `project delete`,
`db import`. The test suite only exercises zero-cost paths.
