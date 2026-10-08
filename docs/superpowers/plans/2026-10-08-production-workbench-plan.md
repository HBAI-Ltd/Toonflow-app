# Production Workbench Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a workspace production panel that manages shots, media tasks, retries, synchronization, and async export through the existing server API.

**Architecture:** Add a small typed API client composable in `apps/web`, then add a production panel to the workspace panel switcher. The panel owns polling and abort controllers, persists all edits through the existing server routes, and never reads workspace files directly.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Tabler icons, existing workspace store and server response format.

---

## Chunk 1: API client

### Task 1: Production API client

**Files:**
- Create: `apps/web/src/lib/production.ts`

- [ ] Define typed manifest, shot, media task, and export task shapes matching server responses.
- [ ] Implement `getManifest`, `saveManifest`, `updateShot`, `createShotTasks`, `syncShots`, `listMediaTasks`, `getExportTask`, `createExportTask`, and `cancelExportTask`.
- [ ] Use the current workspace directory from `useWorkspaceStore` when no explicit directory is passed.
- [ ] Add abort signal support to every request and preserve server error messages.

## Chunk 2: Production panel

### Task 2: Workspace production panel

**Files:**
- Create: `apps/web/src/pages/workspace/panels/production/index.vue`
- Modify: `apps/web/src/pages/workspace/index.vue`

- [ ] Add a `production` option to the workspace panel switcher and lazy-load the panel.
- [ ] Load the manifest and task list on activation and on workspace changes.
- [ ] Render selectable shot rows with status, title, prompt summary, model, output path, and error state.
- [ ] Add controls for refresh, sync, batch generation, retry, and saving shot edits.
- [ ] Poll active media and export tasks with an abortable timer and stop polling on unmount.
- [ ] Render export controls for output path, selected clip paths, progress, cancel, and completion.
- [ ] Keep responsive layout usable in narrow windows and follow existing component naming rules.

## Chunk 3: Verification

### Task 3: Build and manual verification

- [ ] Run `bun run typecheck` in `apps/web`.
- [ ] Run the web build.
- [ ] Start the existing dev server and verify panel loading, shot save, task submission, task sync, and export polling with the local API.
- [ ] Confirm no new test files are added.
- [ ] Commit the panel implementation.

