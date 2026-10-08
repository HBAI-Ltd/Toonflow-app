# Draw Things MiniMax H3 Provider Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a built-in Toonflow media provider that sends video requests to the local Draw Things HTTP API using `minimax_h3_ref2va_i6x.ckpt` and returns an encoded video asset.

**Architecture:** Add a focused provider adapter under `packages/providers/src/media/` and register it with the existing built-in provider list. The adapter uses Draw Things' local HTTP endpoint, accepts the existing text and optional single image reference shape, and only accepts an already encoded video result; workspace persistence remains in `apps/server/src/utils/media/generation.ts`.

**Tech Stack:** TypeScript, Bun `fetch`, Toonflow provider contracts, Vue raw-source built-in provider dialog, existing Bun server build/typecheck.

---

## Chunk 1: Provider Adapter

### Task 0: Lock the Draw Things HTTP contract

**Files:**
- Create: `docs/superpowers/evidence/draw-things-h3-http-contract.md`

- [x] Capture the currently reproducible image API facts and record the H3 video probe failure in `docs/superpowers/evidence/draw-things-h3-http-contract.md`.
- [x] Record that the H3 endpoint completion semantics and encoded-video field remain unverified because the app exits during inference.
- [x] Keep the adapter's H3 request/response handling provisional until a successful H3 response is available; do not claim runtime success.

### Task 1: Add Draw Things provider definition

**Files:**
- Create: `packages/providers/src/media/drawThings.ts`
- Modify: `packages/providers/index.ts`

- [x] Define provider metadata with id `drawThings`, label `Draw Things Local`, and default model id `minimax_h3_ref2va_i6x.ckpt`; use `request.model` at runtime.
- [x] Define and persist the local API URL through the existing built-in settings form, defaulting to `http://127.0.0.1:7888`.
- [x] Map the supported request fields and reject unsupported reference types.
- [x] Use an explicit request timeout combined with the provider AbortSignal.
- [x] Parse encoded video URL/data/base64/direct binary candidates and reject image-frame arrays or incomplete task IDs.
- [x] Return Toonflow `MediaAsset` values and produce clear connection, HTTP, empty-result, and unsupported-reference errors.
- [x] Export the provider in `mediaProviders` while preserving existing provider order and behavior.

### Task 2: Add built-in source to the settings dialog

**Files:**
- Modify: `apps/web/src/components/settings/panels/mediaModel/addCustomProviderDialog.vue`

- [x] Import the raw Draw Things provider source.
- [x] Add the source to `providerSources` so the built-in provider can be installed using the existing dialog and settings form.
- [x] Ensure the dialog does not require an API key for this local provider.

## Chunk 2: Validation And Documentation

### Task 3: Update provider-facing documentation

**Files:**
- Modify: `packages/providers/src/media/drawThings.ts` readme metadata only if needed.
- Modify: `docs/superpowers/specs/2026-10-07-draw-things-minimax-h3-design.md` only if implementation constraints differ.

- [x] Document Draw Things Local API requirements and the current H3 runtime limitation.
- [x] Document the editable default model id and supported first-frame boundary in provider metadata.
- [x] Document that the adapter requires Draw Things to return an encoded video and does not assemble image frames.

### Task 4: Run repository validation

**Files:**
- No new test files; follow repository guidance.

- [x] Run Provider source parsing and dynamic loading validation.
- [x] Run `bun run typecheck` in `apps/server`.
- [x] Run `bun run build` in `apps/server`.
- [x] Run the repository typecheck; record the unrelated Electrobun/Hutch failure.
- [x] Use a mock provider fetch to validate encoded-video parsing without adding a test file.
- [x] Record the blocked Draw Things H3 runtime check in `docs/superpowers/evidence/draw-things-h3-http-contract.md`.

---

## Execution Notes

- Do not add a new HTTP route or duplicate workspace file-writing logic.
- Do not add a test framework or test files; repository guidance explicitly prohibits new tests for this change.
- Do not claim the H3 runtime works until Draw Things returns an encoded video response.
