# P0 Production Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recoverable media task layer, model capability health checks, production shot state tracking, and a minimal FFmpeg delivery pipeline.

**Architecture:** Keep the existing Provider and workspace abstractions. Persist task and production metadata under the workspace, run media generation in a detached in-process task manager, expose status/cancel/retry routes, and use the existing FFmpeg workspace factory for a manifest-driven export operation.

**Tech Stack:** Bun, TypeScript, Express, Zod, `@toonflow/file`, existing Provider and FFmpeg APIs.

---

### Task 1: Persistent media tasks

**Files:**
- Create: `apps/server/src/utils/media/tasks.ts`
- Create: `apps/server/src/routes/ai/media/task.ts`
- Create: `apps/server/src/routes/ai/media/taskStatus.ts`
- Create: `apps/server/src/routes/ai/media/taskCancel.ts`
- Modify: `apps/server/src/routes/ai/media/generate.ts`
- Modify: generated `apps/server/src/router.ts` via `bun run routes`

- [ ] Store task records atomically in workspace `.toonflow/mediaTasks.json`.
- [ ] Start generation asynchronously and return a UUID.
- [ ] Support status, cancel, retry, startup recovery of interrupted tasks.
- [ ] Preserve existing synchronous generation behavior only through the task manager.

### Task 2: Model capability and health

**Files:**
- Create: `apps/server/src/routes/providers/media/health.ts`
- Modify: `apps/server/src/utils/media/provider.ts`
- Modify: `packages/providers/types.d.ts`
- Modify: `packages/providers/src/media/drawThings.ts`
- Modify: generated `apps/server/src/router.ts` via `bun run routes`

- [ ] Add optional provider health contract with model-aware metadata.
- [ ] Implement Draw Things endpoint probe and model listing probe.
- [ ] Return capability, reachability, and actionable failure reason.

### Task 3: Production shot state

**Files:**
- Create: `apps/server/src/utils/production/shots.ts`
- Create: `apps/server/src/routes/production/shots/get.ts`
- Create: `apps/server/src/routes/production/shots/save.ts`
- Create: `apps/server/src/routes/production/shots/update.ts`
- Modify: generated `apps/server/src/router.ts` via `bun run routes`

- [ ] Persist a validated shot manifest under the workspace.
- [ ] Support shot statuses and output references.
- [ ] Keep the API independent of a new frontend UI so existing canvas users can adopt it incrementally.

### Task 4: Manifest-driven delivery export

**Files:**
- Create: `apps/server/src/utils/production/export.ts`
- Create: `apps/server/src/routes/production/export.ts`
- Modify: generated `apps/server/src/router.ts` via `bun run routes`

- [ ] Validate an ordered list of video clips and output path.
- [ ] Use the existing FFmpeg workspace wrapper to concatenate compatible clips.
- [ ] Mark the production manifest exported and return the workspace-relative output path.

### Task 5: Verification and delivery

- [ ] Run `bun run routes`.
- [ ] Run `bun run typecheck` and `bun run build` in `apps/server`.
- [ ] Perform manual HTTP checks for task creation/status/cancel, provider health, shot save/update, and export validation.
- [ ] Commit implementation and push the current branch to `origin`.

