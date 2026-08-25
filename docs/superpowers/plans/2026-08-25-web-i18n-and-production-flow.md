# Web i18n and Production-Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining Chinese/raw keys from the English creation-to-export UI, fix custom Model Mapping, prevent pre-login prompt-language requests, eliminate production-node overlap, and make director cards language-neutral.

**Architecture:** Permanent Vue/component changes land in Toonflow-web source at upstream baseline `9c4cb0ec7d4f6b4067c7768e2df8cdc7f8587214`. This repository imports the rebuilt single-file bundle and retains guarded, byte-idempotent compatibility patches for older bundles. Backend routes own stable model-map data; artwork owns no localized pixels.

**Tech Stack:** Vue 3, Vue Flow, TDesign, md-editor-v3, vue-clip-track, TypeScript, Express, Vitest, Vite single-file bundle.

**Spec:** `docs/superpowers/specs/2026-08-25-english-prompt-zero-cjk-design.md`

## Global Constraints

- Implement backend/bundle work on `codex/web-i18n-production-flow`, never directly on `master`; push and open a PR after verification. The companion Toonflow-web source changes use their own branch and PR in that repository.
- Ownership/order is explicit: Tasks 1–2 and 4–7 belong to this app repository; Task 3 alone belongs
  to the companion Toonflow-web repository. Task 3 must land before app Task 4 imports anything;
  app Task 4 owns the committed provenance manifest.
- The companion Toonflow-web source PR must land first. Record its exact repository URL and final
  commit SHA plus the SHA-256 of the built `dist/index.html`; this repository may import only that
  verified artifact.
- Never translate persisted mode IDs, task states, or chapter-parser compatibility patterns.
- Keep `getPromptLanguage` authenticated; fix the injected widget, not backend auth.
- Every bundle patch validates all anchors before writing, rejects duplicates/unexpected shapes, preserves Chinese locale, and is byte-idempotent.
- Unsupported embedded editor locales fall back to English, never Chinese.
- Production reflow uses measured node dimensions; do not hardcode wider x coordinates.
- Reflow is serialized or generation-token guarded; an older async stabilization/import may never
  overwrite a newer save, and timeout must be handled without an unhandled rejection.
- Director cover images contain no readable language; title overlays remain localized UI text.
- Run bundle patches in a fixed order after any frontend import and before packaging.
- Current backend master includes PR #17; `settings.other.openIsInteracting` is unrelated to final-editor `关闭吸附`.
- Preserve merged PR #15 (`2b3a064`): default chapter regex follows the interface locale, while the AI Regex instruction follows `prompt_language` and infers the submitted text's actual format.

## Ownership Map

| Defect | Permanent source | Current-repo responsibility |
|---|---|---|
| Importer raw keys | Toonflow-web `batchAddScript.vue` + locales | Compatibility catalog patch |
| Interface labels | Toonflow-web `uiConfig.vue` | Literal-triplet patch |
| `文本生视频` | Toonflow-web Workbench `generate/index.vue` | Mode-map patch |
| Markdown tooltips | Toonflow-web MdEditor hosts | MdEditor locale patch |
| Final editor Chinese | Toonflow-web editVideo/mediaLibrary + vue-clip-track locale | VideoTrack locale/guidance patch |
| Login 401 | `scripts/patch-web-settings.ts` | Token and page-mount guard |
| Model Mapping TypeError/prompt policy | Backend row contract + Toonflow-web `modelMap.vue` | Stable key + localized policy/contract badges |
| Node overlap | Toonflow-web `views/production/index.vue` | Import rebuilt bundle |
| Cover text | `data/skills/story_skills/*/images/title.png` | Text-free replacement |

## Existing Chapter Regex Boundary (PR #15)

The default regex belongs to the batch script-import UI. English/Vietnamese interface locale starts
with a `Chapter|Episode` parser; Chinese interface locale starts with `第…章/回/节`. The user may edit
that field. Clicking **AI Regex** sends the first 2,000 characters of the submitted script to
`/script/getAiRegex`; the small `universalAi` helper returns a regex inferred from the observed
headings, and the frontend applies it to split the import into chapter/script rows.

This is user-assisted import parsing, not a script/director/production-agent instruction, and it does
not parse `videoDesc` or affect storyboard/video generation. This plan keeps all four patched bundle
call sites and the backend prompt-locale tests from PR #15. The model-prompt plan switches the route
from fallback-capable `t()` to strict `tPrompt()` without changing its behavior.

---

### Task 1: Stabilize the Model Mapping backend contract (app repository)

**Files:**

- Modify: `src/routes/setting/modelMap/getImageAndVideoModel.ts`
- Create: `src/routes/setting/modelMap/getImageAndVideoModel.test.ts`
- Modify: `src/routes/setting/vendorConfig/upVendorModel.ts`
- Create: `src/routes/setting/vendorConfig/upVendorModel.test.ts`
- Modify: `src/i18n/locales/{en,vi,zh}.json`

**Interfaces:**

```ts
export interface ModelMapRow {
  key: string; // `${vendorId}:${modelName}`
  name: string;
  type: "video";
  model: string;
  fileName?: string;
  path?: string;
  languagePolicy: "shipped-strict" | "pinned-locale" | "custom-unscoped";
  promptInputContract: "legacy-v1" | "video-prompt-input/v2";
  compatible: boolean;
}
```

- [ ] **Step 1: Write failing endpoint tests**

Seed one enabled custom vendor with valid image/video models. Assert the endpoint returns only video rows, every row has a unique `key`, and malformed entries are omitted rather than crashing the UI.

```ts
expect(response.body.data[0].promptList).toEqual([
  expect.objectContaining({
    key: "qa-vendor:qa-video",
    name: "Custom Video",
    type: "video",
    model: "qa-video"
  })
]);
```

For `upVendorModel`, persist `first` and `second`, update `second`, and assert only index 1 changes.
Updating an absent model returns a localized error and leaves JSON byte-equivalent. The prompt list
matrix also covers all three language policies and both prompt-input contracts, and flags a V2 row
bound to a legacy prompt as incompatible before generation.

- [ ] **Step 2: Implement stable filtering and keys**

```ts
interface VideoMapModel {
  type: "video";
  name: string;
  modelName: string;
}

function isVideoMapModel(model: unknown): model is VideoMapModel {
  if (!model || typeof model !== "object") return false;
  const value = model as Record<string, unknown>;
  return value.type === "video" && typeof value.name === "string" && typeof value.modelName === "string";
}

const promptList = models
  .filter(isVideoMapModel)
  .map((model) => ({
    key: `${item.id}:${model.modelName}`,
    name: model.name,
    type: "video" as const,
    model: model.modelName,
    ...(promptMap.get(model.modelName) ?? {})
  }));
```

Fix `findIndex((m) => m.modelName !== modelName)` to `===`. When it returns `-1`, explicitly
`return res.status(400).send(error(t("setting.vendorConfig.upVendorModel.notFound", {}, locale)))`
before mutating the array. Add that key to all catalogs.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/routes/setting/modelMap/getImageAndVideoModel.test.ts src/routes/setting/vendorConfig/upVendorModel.test.ts
git add src/routes/setting/modelMap/getImageAndVideoModel.ts src/routes/setting/modelMap/getImageAndVideoModel.test.ts src/routes/setting/vendorConfig/upVendorModel.ts src/routes/setting/vendorConfig/upVendorModel.test.ts src/i18n/locales/en.json src/i18n/locales/vi.json src/i18n/locales/zh.json
git commit -m "fix(model-map): stabilize custom model rows"
```

---

### Task 2: Fix the prompt-language widget authentication boundary (app repository)

**Files:**

- Modify: `scripts/patch-web-settings.ts`
- Modify: `scripts/patch-web-settings.test.ts`
- Create: `scripts/test/executeWidget.ts`
- Modify: `package.json`
- Modify: `yarn.lock`
- Regenerate: `data/web/index.html`

**Interfaces:** The widget mounts only on authenticated Settings -> Language and never fetches without a token.

- [ ] **Step 1: Add failing browser-fixture tests**

Add `jsdom@^26.1.0` to this repository's development dependencies. Export the injected
`widgetSource` from `patch-web-settings.ts` and execute it in a real jsdom fixture through
`scripts/test/executeWidget.ts`; do not test only for source-string fragments.

```ts
localStorage.removeItem("token");
runWidgetAgainstLoginLanguageControl();
expect(fetch).not.toHaveBeenCalled();
expect(document.querySelector("#toonflow-prompt-language")).toBeNull();

localStorage.setItem("token", "test-token");
runWidgetAgainstSettingsLanguagePage();
expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/setting/language/getPromptLanguage"), expect.any(Object));
```

- [ ] **Step 2: Guard mount, load, and save**

Add `authToken()` around localStorage. `ensure()` removes/does not create the widget without a token.
`load()` and `pick()` return before network access without a token. `assertAnchors()` requires the
stable Settings Language anchor `.languageConfig .langGrid`; locale names alone are insufficient
because they also appear on login.

- [ ] **Step 3: Verify, regenerate, and commit**

```bash
yarn vitest run scripts/patch-web-settings.test.ts
yarn i18n:patch-settings
yarn i18n:patch-settings
git add scripts/patch-web-settings.ts scripts/patch-web-settings.test.ts scripts/test/executeWidget.ts package.json yarn.lock data/web/index.html
git commit -m "fix(settings): skip prompt language widget before login"
```

Second patch run must be byte-identical.

---

### Task 3: Add exact upstream Toonflow-web source fixes (companion repository)

**Repository:** `HBAI-Ltd/Toonflow-web` (or the maintainer fork), based on commit `9c4cb0ec7d4f6b4067c7768e2df8cdc7f8587214`.

**Files:**

- Modify: `src/views/script/components/batchAddScript.vue`
- Modify: `src/components/setting/components/uiConfig.vue`
- Modify: `src/components/setting/components/modelMap.vue`
- Modify: `src/components/editMdPreivew.vue`
- Modify: `src/components/promptManage.vue`
- Modify: `src/components/skillManagement.vue`
- Modify: `src/views/production/node/script.vue`
- Modify: `src/views/production/node/scriptPlan.vue`
- Modify: `src/views/production/node/storyboardTable.vue`
- Modify: `src/views/project/components/projectDialog.vue`
- Modify: `src/views/scriptAgent/index.vue`
- Modify: `src/views/production/components/workbench/generate/index.vue`
- Modify: `src/views/production/components/workbench/editVideo/index.vue`
- Modify: `src/views/production/components/workbench/editVideo/mediaLibrary.vue`
- Modify: `src/views/production/index.vue`
- Create: `src/utils/chapterRegex.ts`
- Create: `src/utils/chapterRegex.test.ts`
- Modify: `src/utils/parseScript.ts`
- Create: `src/utils/parseScript.test.ts`
- Modify: `src/utils/axios.ts`
- Create: `src/utils/axios.test.ts`
- Create: `src/utils/embeddedEditorLocale.ts`
- Create: `src/utils/embeddedEditorLocale.test.ts`
- Create: `src/views/production/utils/reflowDownstream.ts`
- Create: `src/views/production/utils/reflowDownstream.test.ts`
- Modify: `src/locales/language/{en,vi-VN,zh-CN}.json`
- Modify: upstream `package.json` and lockfile to add `vitest@^3.2.4`, `@vue/test-utils@^2.4.6`, and `jsdom@^26.1.0`
- Create: upstream `vitest.config.ts` with Vue plugin, the existing `@` alias, and `environment: "jsdom"`
- Create: focused component/unit tests beside the changed source modules

**Interfaces:**

```ts
export function embeddedEditorLocale(locale: string | undefined): "zh-CN" | "en-US" {
  return /^zh(?:-|$)/i.test(locale ?? "") ? "zh-CN" : "en-US";
}
```

- [ ] **Step 1: Add missing locale keys**

Add `workbench.script.import.getAiRegex`, `workbench.script.import.col.chapter`, Interface Settings
label keys, model type keys, media guidance, and final-editor labels to all three locale files. Reuse
the existing mode keys `workbench.generate.modeSingleImage`, `modeStartEnd`, `modeText`,
`modeVideoRef`, `modeImageRef`, `modeAudioRef`, and `modeTextRef`; add only a genuinely missing
frame/suffix variant. Component tests assert `AI Regex`, `Chapter`, `Color mode`, `Primary color`,
`Font size`, `Text to Video`, and `Video` in English.

- [ ] **Step 2: Replace UI literals with `$t()`**

In `uiConfig.vue`, replace `颜色模式`, `主题色`, `字体大小`. In `modelMap.vue`, add `key: string`
to `PromptList`, keep `fileName`/`path` optional, replace the ternary `文本/视频/图片` with catalog
values, use `row.key` for prompt rows, and use `item.id` for the outer vendor collapse key. Render
localized badges/warnings for `shipped-strict`, `pinned-locale`, and `custom-unscoped`, plus
`legacy-v1`/`video-prompt-input/v2` compatibility. Block an incompatible binding or generation with
a localized warning before provider invocation; do not imply that custom content was validated or
translated. In
`generate/index.vue`, replace the local Chinese `modeLabelMap` with computed `$t()` values while
preserving mode IDs.

- [ ] **Step 3: Port PR #15 chapter behavior into maintained source**

Implement `defaultChapterRegex(locale)` in `src/utils/chapterRegex.ts` with fresh `RegExp` instances:
`Chapter|Episode` for en/vi/unsupported locales and `第…章/回/节` for `zh*`. Make
`parseScript.ts` use it only when the custom regex is absent or blank; an invalid nonblank user regex
retains the existing validation error and never silently falls back. Initialize/reset the editable regex
field in `batchAddScript.vue` from `cachedLocale`, while the AI Regex button continues to send the
first 2,000 submitted characters to `/script/getAiRegex`. Tests cover en, vi, zh-CN, reset,
`lastIndex` isolation, user override, and a submitted format that differs from UI/prompt language.

- [ ] **Step 4: Send the interface locale upstream**

In `src/utils/axios.ts`, add `X-Toonflow-Lang` from the normalized cached/localStorage interface
locale on every request, without changing Authorization behavior. Unit tests cover absent locale,
quoted legacy storage values, en/vi/zh, and token preservation. This ports the locale-header portion
of the current compatibility patch so importing a new source bundle cannot regress backend
`content_language` selection.

- [ ] **Step 5: Propagate editor locale**

Implement `embeddedEditorLocale()` in `src/utils/embeddedEditorLocale.ts` and test `zh`, `zh-CN`,
`en`, `vi-VN`, empty, and unsupported values. Import `cachedLocale` from `src/locales/index.ts` and
pass `:language="embeddedEditorLocale(cachedLocale)"` to every MdEditor and MdPreview in
`editMdPreivew.vue`, `promptManage.vue`, `skillManagement.vue`, `production/node/script.vue`,
`scriptPlan.vue`, `storyboardTable.vue`, `projectDialog.vue`, `scriptAgent/index.vue`, and
`modelMap.vue`. For pinned `vue-clip-track@0.1.5`, use its supported locale object deterministically:

```ts
import { VideoTrack, locales } from "vue-clip-track";
const videoTrackLocale = computed(() => locales[embeddedEditorLocale(cachedLocale.value)]);
```

Pass `<VideoTrack :locale="videoTrackLocale" :track-types="trackTypes" />`. Make `trackTypes` a
computed value from the same app locale and explicitly provide localized `name` values for video,
image, audio, subtitle, text, sticker, filter, and effect. Tests cover those names plus the library's
English/Chinese toolbar and `snapOn`/`snapOff` strings.

- [ ] **Step 6: Localize final-editor guidance**

Replace `视频素材名字按照分镜台组#号数字命名` in `mediaLibrary.vue` with `$t("workbench.production.editVideo.mediaNamingHint")`. Assert English track names, `Disable Snap`, and no Chinese accessible labels.

- [ ] **Step 7: Add measured downstream reflow**

Implement the pure coordinate calculation in `src/views/production/utils/reflowDownstream.ts`, then call it from `src/views/production/index.vue`:

```ts
export function calculateDownstreamPositions(
  nodes: Node[],
  dimensions: Record<string, { width: number; height: number }>,
  changedId: "scriptPlan" | "storyboardTable",
  gap = 80,
): Node[];

const mainChain = ["script", "scriptPlan", "storyboardTable", "storyboard", "workbench"] as const;

function measuredDimensions(ids: readonly string[]): Record<string, { width: number; height: number }> {
  return Object.fromEntries(ids.map((id) => {
    const node = findNode(id);
    return [id, { width: node?.dimensions?.width ?? 150, height: node?.dimensions?.height ?? 50 }];
  }));
}

async function waitForStableDimensions(ids: readonly string[], maxRetries = 30): Promise<void> {
  let previous = "";
  let stableCount = 0;
  while (maxRetries-- > 0) {
    const snapshot = ids.map((id) => {
      const node = findNode(id);
      return `${id}:${node?.dimensions?.width ?? 0}x${node?.dimensions?.height ?? 0}`;
    }).join(",");
    const allMeasured = ids.every((id) => {
      const dimensions = findNode(id)?.dimensions;
      return (dimensions?.width ?? 0) > 0 && (dimensions?.height ?? 0) > 0;
    });
    if (allMeasured && snapshot === previous && ++stableCount >= 2) return;
    if (snapshot !== previous) stableCount = 0;
    previous = snapshot;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error("Vue Flow dimensions did not stabilize");
}

function syncNodePositions(): void {
  for (const node of getNodes.value) {
    nodePositions.value[node.id] = { x: node.position.x, y: node.position.y };
  }
}

let reflowGeneration = 0;
let graphMutationQueue: Promise<void> = Promise.resolve();

function enqueueGraphMutation(generation: number, mutation: () => Promise<void>): Promise<void> {
  const run = graphMutationQueue.then(async () => {
    if (generation !== reflowGeneration) return;
    await mutation();
  });
  graphMutationQueue = run.catch(reportGraphMutationFailure);
  return run;
}

async function applySuccessfulSave(snapshot: ReturnType<typeof toObject>): Promise<number> {
  const generation = ++reflowGeneration;
  await enqueueGraphMutation(generation, async () => {
    if (generation !== reflowGeneration) return; // immediately before the queued mutation
    await fromObject(snapshot);
    await nextTick();
    syncNodePositions();
  });
  return generation;
}

async function reflowDownstream(changedId: "scriptPlan" | "storyboardTable", generation: number) {
  await nextTick();
  if (generation !== reflowGeneration) return;
  updateNodeInternals([...mainChain]);
  try {
    await waitForStableDimensions(mainChain);
  } catch (error) {
    if (generation === reflowGeneration) reportReflowTimeout(error);
    return;
  }
  if (generation !== reflowGeneration) return;
  const snapshot = toObject();
  snapshot.nodes = calculateDownstreamPositions(snapshot.nodes, measuredDimensions(mainChain), changedId, 80);
  await enqueueGraphMutation(generation, async () => {
    if (generation !== reflowGeneration) return; // immediately before the queued mutation
    await fromObject(snapshot);
    await nextTick();
    syncNodePositions();
  });
}

let reflowTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleDownstreamReflow(changedId: "scriptPlan" | "storyboardTable") {
  clearTimeout(reflowTimer);
  const generation = ++reflowGeneration;
  reflowTimer = setTimeout(() => void reflowDownstream(changedId, generation), 0);
}

watch(
  [
    () => JSON.stringify(flowData.value.scriptPlan),
    () => JSON.stringify(flowData.value.storyboardTable),
  ],
  ([nextPlan, nextTable], [previousPlan, previousTable]) => {
    const changedId = nextPlan !== previousPlan
      ? "scriptPlan"
      : nextTable !== previousTable
        ? "storyboardTable"
        : null;
    if (changedId) scheduleDownstreamReflow(changedId);
  },
);
```

Watch the exact `flowData.scriptPlan` and `flowData.storyboardTable` values, compare previous/next
serialized content, and after successful saves debounce one reflow. A collision requires both
vertical-range overlap and horizontal overlap with the predecessor's right edge plus the 80px gap.
When collided, shift that node and its remaining successors by the minimum delta; preserve every y
coordinate and relative x spacing. Nodes already farther right or vertically disjoint remain
unchanged. Do not call `layoutGraph()` for content expansion.

Every continuation after `nextTick` and stabilization checks the monotonically increasing generation.
Every save handler applies its returned graph through `applySuccessfulSave()`; direct save-side
`fromObject()` calls are forbidden. Both save application and reflow import therefore share
`graphMutationQueue`, and each checks the token immediately before its queued mutation. A save that
arrives while an older import is running queues behind it and becomes the final mutation; a queued
older generation becomes a no-op. Catch stabilization and mutation failures, report them once, and
retain the newest saved graph without an unhandled rejection. Fake-timer/deferred-promise tests cover
rapid plan then table changes, table then plan changes, a deferred old reflow followed by a newer
save, a deferred save followed by a newer reflow, and timeout; they assert the newest graph is the
only final state and that no stale `fromObject` begins after its generation is superseded.

- [ ] **Step 8: Add source-level tests**

Add `"test": "vitest run"` and Vitest/jsdom/component tests for locale normalization, mode labels,
model-map rows, Markdown/MdPreview locale props, VideoTrack locale props, and
`calculateDownstreamPositions()` with measured widths. The pure layout test proves horizontally and
vertically overlapping nodes shift minimally with successors, vertically disjoint nodes do not move,
y coordinates remain unchanged, and relative order is preserved. The component test expands Shooting
Plan and asserts the correct changed-node id is scheduled without mounting the full Vue Flow canvas.
The real Storyboard Table/Workbench click-through remains a required browser assertion in Task 7,
because jsdom cannot validate Vue Flow hit-testing and rendered geometry reliably.

Model-map component tests assert localized badges/warnings for all language policies and both input
contracts, and prove an incompatible save/generate action never calls the backend generation API.

- [ ] **Step 9: Verify and commit upstream**

```bash
yarn type-check
yarn i18n:check
yarn test
yarn build
git add src package.json yarn.lock vitest.config.ts
git commit -m "fix(web): localize editors, mappings, and production layout"
```

After the source PR is finalized, hand off the exact repository URL, final commit SHA (not merely the
starting baseline), build command/toolchain lock hash, and SHA-256 of its produced `dist/index.html`
to this repository's Task 4. Task 3 does not commit the app provenance manifest. The app import PR
must not start from an uncommitted upstream workspace or a different commit.

---

### Task 4: Commit provenance and import the rebuilt frontend (app repository)

**Files in this repository:**

- Replace from upstream build: `data/web/index.html`
- Create: `docs/i18n/toonflow-web-bundle-provenance.json`
- Create: `scripts/i18n-check-web-provenance.ts`
- Create: `scripts/i18n-check-web-provenance.test.ts`
- Create: `scripts/patch-web-production-ui.ts`
- Create: `scripts/patch-web-production-ui.test.ts`
- Create: `scripts/patch-web-all.ts`
- Create: `scripts/patch-web-all.test.ts`
- Modify: `scripts/patch-web-i18n.ts`
- Modify: `scripts/patch-web-i18n.test.ts`
- Modify: `scripts/patch-web-ui.ts`
- Modify: `scripts/patch-web-ui.test.ts`
- Modify: `scripts/patch-web-settings.ts`
- Modify: `scripts/patch-web-settings.test.ts`
- Modify: `package.json`
- Modify: `docs/i18n/README.md`

**Interfaces:**

```ts
export type BundleSubpatchState = "patched-legacy" | "verified-source-fixed" | "injected-extension";
export function patchProductionUiBundle(source: string): {
  output: string;
  states: Record<
    "importerKeys" | "interfaceLabels" | "workbenchModes" | "markdownLocale" |
    "finalEditorLocale" | "modelMap",
    BundleSubpatchState
  >;
};

export function patchAllWebBundles(source: string): {
  output: string;
  states: {
    i18n: Record<string, BundleSubpatchState>;
    ui: Record<string, BundleSubpatchState>;       // owns localeHeader + chapterRegex
    settings: Record<string, BundleSubpatchState>; // owns promptLanguageWidget
    productionUi: Record<string, BundleSubpatchState>;
  };
};
```

`scripts/patch-web-all.ts` imports each pure patch function under a distinct name, applies them in
the exact order i18n -> ui -> settings -> productionUi, aggregates their owner-specific states, and
writes `data/web/index.html` once only after every subpatch validates. This is the truthful owner of
the aggregate result; individual patchers report only their own keys.

- [ ] **Step 1: Write old-bundle and already-fixed-bundle fixtures**

Cover the exact current anchors:

```text
workbench.script.import.getAiRegex
workbench.script.import.col.chapter
c(u,{label:"颜色模式"} ... label:"主题色" ... label:"字体大小"
singleImage:"单图" ... text:"文本生视频"
language:{type:String,default:"zh-CN"}
locale:{default:"zh-CN"}
V.type=="text"?"文本":V.type=="video"?"视频":"图片"
视频素材名字按照分镜台组#号数字命名
```

Tests prove English/Vi fixes, Chinese preservation, missing/duplicate anchor failures for an old
bundle, acceptance of known already-fixed source output, and byte-idempotence. Update all four
patchers (`patch-web-i18n`, `patch-web-ui`, `patch-web-settings`, and `patch-web-production-ui`) so
each subpatch independently reports one allowed state: a known legacy anchor was patched, a known
source-fixed shape was verified/no-op, or an expected local extension was absent and injected. The
prompt-language widget is such a local extension and must still be injected into a rebuilt upstream
bundle unless it is later source-owned. A rebuilt bundle may therefore mix allowed states across
subpatches. Only an unknown, duplicate, or contradictory partial state within one subpatch fails.

- [ ] **Step 2: Verify source provenance, then patch only compatibility targets**

Require Task 3's finalized companion source PR first. Commit a manifest containing exact upstream
repository URL, final source commit SHA, build command, lockfile/toolchain hash, unpatched
`dist/index.html` SHA-256, and final patched bundle SHA-256. CI checks out/rebuilds that exact commit
or verifies the immutable source artifact, then rejects any hash mismatch before importing or
packaging. Copy only the verified `dist/index.html` to this repository's exact
`data/web/index.html`, then run the patch chain. Inject one module-scope locale helper after the unique
module script tag only for a subpatch that still needs it. Patch remaining known legacy catalog/UI
anchors and inject expected local extensions; verify/no-op the chapter regex, locale header, editor,
layout, and other source-owned fixes. Report a per-subpatch state rather than treating the entire
bundle as globally old or fixed.

- [ ] **Step 3: Add ordered patch command**

```json
"i18n:patch-production-ui": "tsx scripts/patch-web-production-ui.ts",
"i18n:patch-web-all": "tsx scripts/patch-web-all.ts"
```

- [ ] **Step 4: Verify imported bundle and idempotence**

```bash
yarn vitest run scripts/patch-web-ui.test.ts scripts/patch-web-i18n.test.ts scripts/patch-web-settings.test.ts scripts/patch-web-production-ui.test.ts scripts/patch-web-all.test.ts
yarn vitest run scripts/i18n-check-web-provenance.test.ts
yarn i18n:check-web-provenance
yarn i18n:patch-web-all
first_hash="$(shasum -a 256 data/web/index.html | awk '{print $1}')"
yarn i18n:patch-web-all
second_hash="$(shasum -a 256 data/web/index.html | awk '{print $1}')"
test "$first_hash" = "$second_hash"
```

The final assertion must exit zero.

- [ ] **Step 5: Commit**

```bash
git add data/web/index.html docs/i18n/toonflow-web-bundle-provenance.json scripts/i18n-check-web-provenance.ts scripts/i18n-check-web-provenance.test.ts scripts/patch-web-i18n.ts scripts/patch-web-i18n.test.ts scripts/patch-web-ui.ts scripts/patch-web-ui.test.ts scripts/patch-web-settings.ts scripts/patch-web-settings.test.ts scripts/patch-web-production-ui.ts scripts/patch-web-production-ui.test.ts scripts/patch-web-all.ts scripts/patch-web-all.test.ts package.json docs/i18n/README.md
git commit -m "fix(web): import localized production workflow"
```

---

### Task 5: Make bundle patches a release prerequisite

**Files:**

- Modify: `scripts/build.ts`
- Create: `scripts/build.test.ts`
- Modify: `docs/i18n/README.md`

- [ ] **Step 1: Add failing order/failure tests**

Refactor the current IIFE behind exported seams:

```ts
export function runBundlePatches(run = execFileSync): void;
export async function build(run = execFileSync): Promise<void>;
```

Keep a `require.main === module` entry guard. Mock process execution and assert this exact order before
esbuild: the shared `i18n:ci` quality gate, `i18n:check-web-provenance`, then the atomic
`i18n:patch-web-all` orchestrator. In
`patch-web-all.test.ts`, separately assert its pure-function order is i18n -> ui -> settings ->
productionUi and that a failure writes nothing. Assert any failed prerequisite prevents both
`esbuild.build()` calls.

- [ ] **Step 2: Execute patch commands synchronously**

Use `execFileSync("yarn", [script], { stdio: "inherit" })` for each command before the existing build
calls. Sequential execution is required because all patchers mutate one bundle. Packaging must not
proceed unless the full shared quality gate and provenance check exit successfully.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run scripts/build.test.ts scripts/patch-web-ui.test.ts scripts/patch-web-i18n.test.ts scripts/patch-web-settings.test.ts scripts/patch-web-production-ui.test.ts scripts/patch-web-all.test.ts
git add scripts/build.ts scripts/build.test.ts docs/i18n/README.md
git commit -m "build: require web localization patches"
```

---

### Task 6: Replace baked-language director covers

**Files:**

- Modify:
  - `data/skills/story_skills/Comedy_humor/images/title.png`
  - `data/skills/story_skills/Coming_of_age/images/title.png`
  - `data/skills/story_skills/Family_warmth/images/title.png`
  - `data/skills/story_skills/Historical_epic/images/title.png`
  - `data/skills/story_skills/Horror_supernatural/images/title.png`
  - `data/skills/story_skills/Hot_blooded_action/images/title.png`
  - `data/skills/story_skills/Medieval_epic/images/title.png`
  - `data/skills/story_skills/Mystery_thriller/images/title.png`
  - `data/skills/story_skills/Psychological_drama/images/title.png`
  - `data/skills/story_skills/Scifi_post_apocalypse/images/title.png`
  - `data/skills/story_skills/Sweet_romance_novel/images/title.png`
  - `data/skills/story_skills/Urban_workplace_drama/images/title.png`
  - `data/skills/story_skills/Xianxia_fantasy/images/title.png`
- Modify: `src/routes/project/queryDirectorManual.ts`
- Create: `src/routes/project/queryDirectorManual.test.ts`

- [ ] **Step 1: Add a deterministic route test**

Fixture one story skill with localized README/manual files and two images. Assert localized name/data labels and sorted image URLs.

- [ ] **Step 2: Replace all title covers with text-free art**

Use the image-generation/editing workflow during execution. Preserve filenames and genre identity, but remove Chinese, English, Vietnamese, title plaques, logos, and watermark text.

- [ ] **Step 3: Sort image files before returning URLs**

```ts
const images = files.filter((file) => /\.(png|jpe?g|gif|webp|svg)$/i.test(file)).sort().map((file) => path.join("story_skills", imagesDir, "images", file));
```

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/routes/project/queryDirectorManual.test.ts
git add data/skills/story_skills src/routes/project/queryDirectorManual.ts src/routes/project/queryDirectorManual.test.ts
git commit -m "fix(covers): remove baked-language director titles"
```

---

### Task 7: Full browser and build verification

**Files:** Verify Tasks 1–6; update only files tied to reproducible failures.

- [ ] **Step 1: Run source and bundle gates**

```bash
yarn i18n:ci
yarn i18n:check-web-provenance
yarn i18n:patch-web-all
yarn i18n:patch-web-all
yarn build
git diff --check
```

- [ ] **Step 2: Repeat English QA**

Verify: AI Regex/Chapter labels; an English `Chapter 12: ...` import splits correctly; AI Regex infers
the submitted format; Interface Settings labels; Text to Video; English Markdown tooltips; English
final editor/snap/track labels/guidance; custom Model Mapping with no console TypeError; no login
prompt-language request; clickable Storyboard Table and Workbench after expanded saves; text-free
director covers.

- [ ] **Step 3: Run locale regressions**

Repeat the critical UI path in `vi` and `zh`. Chinese locale keeps its `第…章/回/节` default;
Vietnamese keeps the `Chapter|Episode` default and does not fall back to Chinese; AI Regex still
detects headings that differ from the UI/prompt language. All three retain identical mode IDs and
model-map keys.

- [ ] **Step 4: Inspect status**

```bash
git status --short
git diff --check
git log --oneline -12
```

Expected: only intended files/commits; pre-existing `.gstack/` remains untouched.

The shared `i18n:ci` quality job and web-provenance check are mandatory packaging gates; do not
waive either because of unrelated failures.
