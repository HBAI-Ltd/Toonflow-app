# huobao-drama Integration Audit

Date: 2026-06-14

This document audits the current integration between Toonflow and `/Users/yuanjiantsui/dev/02-ai/huobao-drama`.

Current target branch:

- Repository: `let5sne/Toonflow-app`
- Branch: `codex/video-compose-integration`
- Baseline commit: `c671c0a feat: integrate video compose workflow`

## Executive Summary

The current Toonflow branch has integrated the core video composition slice from huobao-drama:

- FFmpeg single-shot composition
- episode merge/export
- grid storyboard generation and splitting
- structured storyboard fields for dialogue/sound/shot/camera data
- queue-backed compose/merge/grid jobs
- a visible compose task entry in the Toonflow video editing desk

This is not a full huobao-drama product migration. huobao-drama is a broader short-drama production system with its own Studio frontend, AI provider configuration, Mastra agents, skills, voice assignment, asset references, and storyboard prompt generation. The current Toonflow integration should be treated as a preview-grade video composition integration, not a complete product merger.

Estimated completion:

| Scope | Completion | Assessment |
| --- | ---: | --- |
| Core video composition workflow | 80% | Main compose/merge path works and was browser/API verified. |
| huobao-drama FFmpeg capability migration | 85% | Toonflow version is more queue-native, but some subtitle/voice details remain simplified. |
| Grid image workflow | 65% | Generation/splitting exists; automatic prompt/reference collection is incomplete. |
| Structured storyboard metadata | 70% | Backend fields/API exist; native frontend editing experience is incomplete. |
| Frontend product integration | 55% | Usable compose panel exists, but it is still an injected web script rather than native UI. |
| Agent workflow integration | 25% | Some ideas were absorbed; huobao agents were not migrated. |
| Clean release readiness | 80% | Clean-clone install/lint/startup/API verification passed with a seeded demo DB; native frontend entry remains brittle. |
| Upstream PR readiness | 30% | Needs decomposition into smaller PRs and stronger tests/docs. |

## Source Capability Map

| huobao-drama Capability | Source Reference | Toonflow Status | Toonflow Implementation | Notes |
| --- | --- | --- | --- | --- |
| FFmpeg single-shot composition | `backend/src/routes/compose.ts`, `backend/src/services/ffmpeg-compose.ts` | Migrated | `src/routes/production/workbench/composeVideo.ts`, `src/utils/composeHandlers.ts`, `src/utils/ffmpegTool.ts` | Queue-backed in Toonflow. Supports selected video, optional TTS, SRT subtitle burn-in, normalized MP4 output. |
| Compose status query | `GET /compose/episodes/:id/compose-status` | Migrated with different API shape | `src/routes/production/workbench/getComposeList.ts` | Toonflow uses `o_videoCompose` records and list polling. |
| Batch compose all shots | `POST /compose/episodes/:id/compose-all` | Partially migrated | `composeVideo` accepts `trackIds[]` | Toonflow requires selected track IDs from the editing desk. No one-click "all episode tracks" API yet. |
| Episode merge/export | `backend/src/routes/merge.ts`, `backend/src/services/ffmpeg-merge.ts` | Migrated | `src/routes/production/workbench/mergeEpisode.ts`, `src/routes/production/workbench/getMergeList.ts` | Toonflow implementation is stronger: latest composed clip is preferred, selected raw video is fallback, segments are normalized before concat. |
| FFmpeg availability requirement | README, Dockerfile | Partially migrated | `src/utils/ffmpegTool.ts`, `docs/video-compose-features.md` | Runtime checks exist indirectly; user-facing missing-ffmpeg UX is still weak. |
| Subtitle generation | `ffmpeg-compose.ts` inline SRT | Migrated and improved | `src/utils/subtitle.ts` | Toonflow has dedicated extraction/ignore/build helpers. |
| TTS inline generation | `ffmpeg-compose.ts`, `tts-generation.ts` | Partially migrated | `composeHandlers.ts` via `Ai.Audio` | Optional TTS exists, but huobao voice assignment and per-character voice lookup are not fully mapped. |
| Grid image generation | `backend/src/routes/grid.ts`, `backend/src/services/grid-split.ts` | Partially migrated | `src/routes/production/storyboard/generateGridImage.ts`, `src/utils/gridImage.ts` | Generation and splitting exist. Prompt construction/reference collection is much less complete than huobao. |
| Grid prompt generator skill | `skills/grid_prompt_generator/SKILL.md` | Not migrated | None yet | Highest-value next gap. Needs first-frame/first-last/multi-ref prompt builder and "exactly N panels" constraints. |
| Storyboard breaker schema | `skills/storyboard_breaker/SKILL.md` | Partially migrated | `o_storyboard` new fields, `updateStoryboardInfo.ts` | Toonflow only added selected fields: dialogue, soundEffect, shotType, cameraMovement. Full schema such as angle/action/result/atmosphere/bgm/video_prompt is not mapped. |
| Character/scene reference collection | `routes/grid.ts` helpers | Not migrated | None yet | huobao collects character, scene, storyboard first/last/composed/reference images for consistency. Toonflow currently relies mainly on caller-provided prompt. |
| Voice assignment | `skills/voice_assigner/SKILL.md`, `aiVoices.ts` | Not migrated | None yet | Toonflow can pass a voice string to compose, but no character-to-voice assignment workflow exists. |
| Script rewrite agent | `skills/script_rewriter/SKILL.md` | Not migrated | Existing Toonflow script agent remains separate | Not required for compose preview. |
| Character/scene extractor agent | `skills/extractor/SKILL.md` | Not migrated | Existing Toonflow asset flows remain separate | Needs separate product decision. |
| Mastra agent architecture | README, backend agents | Not migrated | Toonflow existing agent architecture | Full agent migration is out of current integration scope. |
| AI provider adapter center | `backend/src/services/adapters/*`, `aiConfigs.ts` | Not migrated | Toonflow vendor/model system remains authoritative | This is intentionally not copied; direct migration would duplicate Toonflow's model configuration model. |
| huobao Studio frontend | `frontend/app/*` | Not migrated | `data/web/toonflow-compose-desk.js/css` | Toonflow keeps its own UI. Current integration is a compose panel injected into the existing video editing desk. |
| Docker compose workflow | huobao Docker docs | Partially migrated | `docker-compose.yml`, existing `Dockerfile` | Basic local Docker entry exists. Needs clean-clone verification. |

## Current Toonflow Implementation Inventory

Backend routes added or extended:

- `POST /api/production/workbench/composeVideo`
- `POST /api/production/workbench/getComposeList`
- `POST /api/production/workbench/mergeEpisode`
- `POST /api/production/workbench/getMergeList`
- `POST /api/production/storyboard/generateGridImage`
- `POST /api/production/storyboard/updateStoryboardInfo`
- `POST /api/assetsGenerate/getCandidates`
- `POST /api/assetsGenerate/selectCandidate`
- `POST /api/task/getQueueList`
- `POST /api/task/retryQueueJob`

Core utilities added:

- `src/utils/composeHandlers.ts`
- `src/utils/ffmpegTool.ts`
- `src/utils/subtitle.ts`
- `src/utils/gridImage.ts`
- `src/utils/genQueue.ts`
- `src/utils/queueHandlers.ts`
- `src/utils/scoreImage.ts`
- `src/utils/agent/toolUseGuard.ts`

Frontend integration:

- `data/web/toonflow-compose-desk.js`
- `data/web/toonflow-compose-desk.css`
- The old conflicting `compose-workbench.js` entry was removed from `data/web/index.html`.

Documentation:

- `docs/video-compose-features.md`
- This audit document.

## Verification Evidence

Already verified in the current working project:

- `yarn lint` passed.
- Browser path was verified:
  - `#/production`
  - zoom/pan canvas to `视频工作台`
  - enter video workbench
  - click scissors icon for `剪辑台`
  - open `合成任务`
- The compose task panel displayed:
  - current project and episode
  - first available track
  - Authorization detected
  - compose record `已完成`
  - episode merge record `已完成`
- The duplicate-entry flicker was fixed by removing the old `compose-workbench.js` script reference.
- Git branch `codex/video-compose-integration` was pushed to `let5sne/Toonflow-app`.

Additional clean-clone verification completed:

- Clean clone from `let5sne/Toonflow-app` on branch `codex/video-compose-integration`.
- `yarn install --frozen-lockfile` passed when Electron binary download was skipped for the local check environment.
- `yarn lint` passed.
- `PORT=10590 yarn dev` started successfully, confirming the dev service no longer hard-codes only `10588`.
- `yarn seed:compose-demo` created a minimal local project/script/track/video fixture.
- Browser login against `http://127.0.0.1:10590/#/project` succeeded and displayed `视频合成演示项目`.
- `getGenerateData` returned one storyboard and one ready track.
- `composeVideo` generated a completed `/{projectId}/compose/*.mp4` and subtitle `.srt`; the demo run took about 30 seconds.
- `mergeEpisode` generated a completed `/{projectId}/merge/*.mp4` with duration written back.

Verification still needed:

- FFmpeg absence test and user-facing error state.
- Real merge job after several generated clips in a clean environment.
- Native browser navigation from project canvas/card into the video workbench remains hard to automate because the current project-card entry is not a standard accessible control.

## Gap Analysis

### P0: Release Blocking

1. Clean-clone smoke is missing.
   - Risk: current success may depend on local DB/OSS state.
   - Recommended action: create a clean-clone verification checklist and run it against the pushed fork branch.

2. FFmpeg missing/invalid state is not friendly enough.
   - Risk: users see failed tasks instead of clear setup guidance.
   - Recommended action: add an API preflight or panel status check that calls `checkFfmpegAvailable()`.

3. Compose task panel still relies on injected static JS.
   - Risk: brittle against future frontend bundle rebuilds.
   - Recommended action: acceptable for preview; for productization, migrate into native frontend source if available.

### P1: Highest-Value huobao Capability Gaps

1. Grid prompt generator is not migrated.
   - huobao has explicit prompt rules for:
     - first frame
     - first/last frame
     - multi-reference
     - exactly N visible panels
     - no merged panels/no missing panels
   - Toonflow currently requires the caller to provide prompt text.
   - Recommended action: add a `buildGridPrompt` helper and/or route that builds prompts from selected storyboards.

2. Character/scene/storyboard reference collection is not migrated.
   - huobao collects character images, scene images, storyboard first/last/composed/reference images.
   - Toonflow should map this to its asset/storyboard tables and pass references into image generation where supported.

3. Voice assignment is not migrated.
   - Current compose route accepts a generic `voice`.
   - huobao can infer speaker voice from character data.
   - Recommended action: map dialogue speaker names to Toonflow assets/characters if those entities are available.

### P2: Product Fit and UX

1. One-click "compose all ready tracks" is missing.
   - Current API supports multiple `trackIds`; UI currently emphasizes first available track.
   - Recommended action: add "select all ready tracks" or "compose all ready" action.

2. Structured storyboard editing is backend-only/incomplete.
   - Fields exist, but user-facing editing is not yet a first-class flow.
   - Recommended action: add editable dialogue/sound/shot/camera controls in storyboard or property panel.

3. Queue management is backend-visible but not product-polished.
   - Recommended action: expose task queue state, retry, and failure reason in a predictable UI surface.

### P3: Optional / Not Recommended for Direct Migration

1. huobao full AI provider adapter center.
   - Toonflow already has its own vendor/model system.
   - Direct migration would duplicate architecture.
   - Recommended action: port only adapter-level behavior when a Toonflow vendor lacks equivalent support.

2. huobao full Nuxt Studio frontend.
   - Toonflow has an existing canvas/workbench model.
   - Recommended action: do not migrate wholesale; use it as UX reference.

3. Mastra agent architecture.
   - Toonflow already has script/production agents.
   - Recommended action: port skill content and workflow ideas, not runtime architecture.

## Recommended Next Work Plan

### Step 1: Clean-Clone Verification

Run from a separate temp directory:

```bash
git clone git@github.com:let5sne/Toonflow-app.git Toonflow-app-compose-check
cd Toonflow-app-compose-check
git checkout codex/video-compose-integration
yarn install --frozen-lockfile
yarn lint
yarn seed:compose-demo
PORT=10590 yarn dev
```

Then verify in browser:

1. Open `http://127.0.0.1:10590/#/project`.
2. Login with `admin / admin123`.
3. Confirm `视频合成演示项目` appears.
4. Use the API commands in `docs/video-compose-features.md` to verify `getGenerateData`, `composeVideo`, `getComposeList`, `mergeEpisode`, and `getMergeList`.
5. Confirm returned media URLs use the active port, not a hard-coded `10588`.

### Step 2: Migrate Grid Prompt Generator

Add a Toonflow-native helper:

- `src/utils/gridPrompt.ts`

Expected responsibilities:

- Accept selected storyboard rows and mode.
- Build English prompt.
- Enforce:
  - `rows x cols grid layout`
  - `exactly N visible panels`
  - `consistent art style`
  - `no merged panels`
  - `no missing panels`
  - `no text, no watermark`
- Support:
  - `first_frame`
  - `first_last`
  - `multi_ref`

Potential route:

- `POST /api/production/storyboard/buildGridPrompt`

### Step 3: Reference Asset Collection

Add a Toonflow-native reference collector:

- collect current storyboard image
- collect selected video first frame if available
- collect related scene/character assets if Toonflow data model exposes them
- cap references to a small safe number, e.g. 6

### Step 4: Productize Compose Panel

Improve the current panel:

- FFmpeg availability indicator
- "compose all ready tracks"
- progress state
- failure reason display
- preview/download links
- stable responsive layout

## Decision

The current integration is good enough to keep in the user's own fork as a preview branch.

It is not yet suitable as a single upstream PR to `HBAI-Ltd/Toonflow-app`. If upstream contribution becomes desirable, split it into smaller PRs:

1. Queue safety and utility changes.
2. FFmpeg/subtitle utilities.
3. Compose/merge API.
4. Grid image API.
5. Frontend compose task panel.
6. Documentation.
