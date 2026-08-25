# Video Prompt Contract V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Chinese marker-and-pipe `videoDesc` protocol with versioned, locale-neutral JSON so English video prompt generation contains no Chinese instruction prose and Seedance 2.0 merges all sub-shots into one three-part prompt.

**Architecture:** Store self-describing v2 JSON in the existing `o_storyboard.videoDesc TEXT` column.
New agent writes are V2-only. Provenance-aware server ingestion handles legacy/manual strings before
persistence, while old rows pass through explicit decoders for every known grammar or a read-only
opaque representation. Single and batch generation share one row/prompt contract resolver that
dispatches to V2 JSON, legacy-compat JSON, or byte-exact custom-legacy serialization. Output
validation is contract-specific: V2 uses detailed structured semantics, compat uses a strict opaque
projection result, and custom legacy preserves raw text.

**Tech Stack:** TypeScript, Zod, Express, Knex/SQLite, Vitest, Markdown model prompts.

**Spec:** `docs/superpowers/specs/2026-08-25-english-prompt-zero-cjk-design.md`

## Global Constraints

- Implement on `codex/video-prompt-contract-v2`, never directly on `master`; push and open a PR after verification.
- `prompt_language=en` permits no Chinese application-authored instruction prose.
- Preserve names, dialogue, descriptions, sound effects, and carry-over text byte-for-byte as runtime data.
- Permit only provider literals verified in Task 5. `@图片N`, `<主体N>`, `<场景N>`, and `<道具N>` are candidate syntax, not an active release exception until the evidence gate passes.
- Do not change the `o_storyboard` schema or bulk-rewrite existing rows.
- Keep direct/manual string writes readable during rollout through a separate provenance-aware
  server path; never expose string bypass in the agent tool schema.
- Preserve `o_prompt.useData` and explicit locale-pinned/custom prompt bindings as byte-identical
  user-owned overrides with explicit `languagePolicy` and `promptInputContract` metadata.
- Shipped V2 and compat paths never interpolate `videoDesc` into XML. Preserve the current XML-like
  bytes only inside the quarantined `legacy-v1-custom` serializer for explicitly selected existing
  `useData`/pinned/custom overrides until migration.
- Do not hand-edit `data/serve/app.js`; regenerate it with `yarn build` after source verification.
- Run the provider-literal harness only after explicit approval of the provider, credentials, and
  spend cap; final merge/release is blocked until evidence matches the active vendor/model/version/
  config, template, and token-builder hashes for every selected reference-capable family.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/videoDesc/schema.ts` | V2 schemas, types, ASCII enum vocabulary. |
| `src/lib/videoDesc/legacy.ts` | Provenance-aware explicit decoders plus read-only opaque fallback. |
| `src/lib/videoDesc/index.ts` | Deterministic serializer and v2-or-legacy parser. |
| `src/lib/videoPrompt/input.ts` | Discriminated V2-JSON and legacy-compat-JSON builders. |
| `src/lib/videoPrompt/legacyCustomSerializer.ts` | Golden byte-exact current request serializer for explicit legacy overrides. |
| `src/lib/videoPrompt/providerTokens.ts` | Exact request-cardinality token builder per reference-capable model family. |
| `src/lib/videoPrompt/output.ts` | Strict semantic output schema, validation, and deterministic renderer. |
| `src/agents/productionAgent/tools.ts` | Accept V2 objects only and serialize at the socket boundary. |
| `src/routes/production/storyboard/*` | Provenance-aware legacy/manual ingestion, validation, and persistence. |
| `data/skills/production_execution_storyboard_panel.{md,en.md,vi.md}` | Tell agents to emit named v2 fields. |
| `data/modelPrompt/video/*.{md,en.md,vi.md}` | Consume v2 JSON instead of parsing marker prose. |
| `src/services/videoPromptGeneration.ts` | Shared prompt resolution and request preparation. |
| `src/lib/migrations/promptSeedSync.ts` | Recognize the old English seed as untouched legacy. |
| `data/modelPrompt/video/legacy-v1-compat.{md,vi.md,zh.md}` | Strict exact-locale runtime prompt for opaque/free-form legacy envelopes. |
| `src/lib/prompts/legacyVideoPromptCompat.ts` | Total en/vi/zh fallback text for the safe legacy compatibility adapter. |
| `docs/i18n/prompt-terms.json` | Fixed translation terms and legacy-decode-only tokens only. |
| `docs/i18n/provider-protocol.json` | Evidence index for every selected reference family/provider/model/config. |
| `docs/i18n/provider-evidence/**` | Approval-gated requests, asset/output hashes, responses, evaluations, and artifacts. |

---

### Task 1: Add the typed contract and legacy decoder

**Files:**

- Create: `src/lib/videoDesc/schema.ts`
- Create: `src/lib/videoDesc/legacy.ts`
- Create: `src/lib/videoDesc/index.ts`
- Create: `src/lib/videoDesc/videoDesc.test.ts`

**Interfaces:**

```ts
export const VIDEO_DESC_V2_SCHEMA = "toonflow.video-desc/v2" as const;
export type ShotSize = "extreme-wide" | "long-shot" | "wide" | "medium" | "medium-close" | "close-up" | "extreme-close-up";
export type CameraMovement = "static" | "push-in" | "pull-back" | "pan" | "truck" | "tracking" | "follow" | "whip-pan" | "crane" | "orbit" | "high-angle" | "low-angle" | "handheld" | "one-take";
export type VideoDescParseErrorCode = "INVALID_JSON" | "INVALID_V2" | "UNSUPPORTED_LEGACY_FORMAT" | "LEGACY_FIELD_COUNT" | "LEGACY_INVALID_DURATION" | "LEGACY_INVALID_SHOT_NUMBER" | "DURATION_MISMATCH" | "DUPLICATE_SOURCE_ROW" | "NON_MONOTONIC_SOURCE_ROW" | "SINGLE_SHOT_CARDINALITY" | "STORYBOARD_ASSISTED_CARDINALITY" | "REFERENCE_DUPLICATE_ID" | "REFERENCE_UNKNOWN_ASSET" | "REFERENCE_NAME_MISMATCH" | "REFERENCE_NOT_ASSOCIATED" | "REFERENCE_WRONG_PROJECT" | "DIALOGUE_SPEAKER_NOT_REFERENCED";
export type VideoDescParseResult =
  | { ok: true; value: VideoDescV2; source: "v2" }
  | { ok: true; value: VideoDescV2 | LegacyOpaqueSingleShot; source: "legacy"; legacyGrammar: LegacyGrammar }
  | { ok: false; error: { code: VideoDescParseErrorCode; message: string } };
export function serializeVideoDesc(value: VideoDescV2): string;
export function parseStoredVideoDesc(raw: string, context: LegacyDecodeContext): VideoDescParseResult;
export function decodeLegacyVideoDesc(raw: string, context: LegacyDecodeContext): VideoDescParseResult;
```

- [ ] **Step 1: Write failing tests**

Use this canonical fixture:

```ts
const v2Context = makeDecodeContext({ provenance: "stored-row", mode: "text-multi-reference-group" });
const legacyMarkerContext = makeDecodeContext({ provenance: "stored-row", mode: "text-multi-reference-group", outerDuration: 3 });
const value: VideoDescV2 = {
  schema: "toonflow.video-desc/v2",
  unit: "text-multi-reference-group",
  groupDurationSeconds: 3,
  carryOver: { priorEndState: "A remains beside the desk, facing right." },
  shots: [{
    sourceRow: 1,
    description: "A crouches and turns the safe dial.",
    scene: "study",
    assetReferences: [{ id: 101, name: "A" }, { id: 102, name: "safe" }],
    durationSeconds: 3,
    shotSize: "medium",
    cameraMovement: "static",
    action: "crouches and turns the dial",
    orientation: "facing right",
    spatialRelation: "left foreground",
    emotion: "focused",
    dialogue: { kind: "none", text: "" },
    soundEffects: ["dial clicks"]
  }]
};

expect(parseStoredVideoDesc(serializeVideoDesc(value), v2Context)).toMatchObject({ ok: true, source: "v2", value });
```

Add these named cases with exact expectations:

```ts
const expectCode = (raw: string, code: string, context = legacyMarkerContext) =>
  expect(parseStoredVideoDesc(raw, context)).toMatchObject({ ok: false, error: { code } });
const legacyWithRows = (rows: number[]) => `该组分镜行原文：${rows.map((row) => `序号${row} | desc ${row} | 1 | 中景 | 固定 | |`).join(" | ")}`;
const reorderedValue: VideoDescV2 = {
  shots: value.shots,
  carryOver: value.carryOver,
  groupDurationSeconds: value.groupDurationSeconds,
  unit: value.unit,
  schema: value.schema,
};

it("preserves pipes, quotes, angle brackets, and Chinese dialogue inside v2 data", () => {
  const mixed = { ...value, shots: [{ ...value.shots[0], description: "A says 'open | now <quietly>'", dialogue: { kind: "spoken", text: "你听见了吗？" } }] };
  expect(parseStoredVideoDesc(serializeVideoDesc(mixed), v2Context)).toMatchObject({ ok: true, source: "v2", value: mixed });
});
it("returns LEGACY_FIELD_COUNT when a row has five fields", () => expectCode("该组分镜行原文：序号1 | desc | 3 | 中景 | 固定 |", "LEGACY_FIELD_COUNT"));
it("returns LEGACY_INVALID_DURATION for nonnumeric duration", () => expectCode("该组分镜行原文：序号1 | desc | many | 中景 | 固定 | |", "LEGACY_INVALID_DURATION"));
it("returns DUPLICATE_SOURCE_ROW for repeated rows", () => expectCode(legacyWithRows([1, 1]), "DUPLICATE_SOURCE_ROW"));
it("returns NON_MONOTONIC_SOURCE_ROW for decreasing rows", () => expectCode(legacyWithRows([2, 1]), "NON_MONOTONIC_SOURCE_ROW"));
it("returns DURATION_MISMATCH for duration mismatch", () => expectCode(JSON.stringify({ ...value, groupDurationSeconds: 99 }), "DURATION_MISMATCH"));
it("returns UNSUPPORTED_LEGACY_FORMAT for an unknown alias", () => expectCode("该组分镜行原文：序号1 | desc | 3 | 未知景别 | 固定 | |", "UNSUPPORTED_LEGACY_FORMAT"));
it("returns INVALID_V2 for an empty description", () => expectCode(JSON.stringify({ ...value, shots: [{ ...value.shots[0], description: "" }] }), "INVALID_V2"));
it("returns INVALID_V2 for an unexpected top-level key", () => expectCode(JSON.stringify({ ...value, surprise: true }), "INVALID_V2"));
it("returns SINGLE_SHOT_CARDINALITY for a single-shot without exactly one singular shot", () => expectCode(malformedSingleShot, "SINGLE_SHOT_CARDINALITY"));
it("returns STORYBOARD_ASSISTED_CARDINALITY for missing reference or substituted detailed shots", () => expectCode(malformedStoryboardAssisted, "STORYBOARD_ASSISTED_CARDINALITY"));
it("accepts fractional durations within epsilon", () => {
  const fractional = { ...value, groupDurationSeconds: 0.3, shots: [{ ...value.shots[0], sourceRow: 1, durationSeconds: 0.1 }, { ...value.shots[0], sourceRow: 2, durationSeconds: 0.2 }] };
  expect(parseStoredVideoDesc(serializeVideoDesc(fractional), v2Context)).toMatchObject({ ok: true, source: "v2", value: fractional });
});
it("serializes property-order permutations byte-identically", () => expect(serializeVideoDesc(reorderedValue)).toBe(serializeVideoDesc(value)));
```

Test every legacy alias listed in Step 4, not only a sample.

Add real captured decoder fixtures for every persisted historical family: marker/pipe `序号N`;
numeric Markdown table rows with leading/trailing pipes; a 12-field ideographic-comma single shot;
first/last-frame free-form text;
storyboard-assisted fixed text `参考故事板内容进行视频生成`; and an arbitrary manual edit accepted
by `editStoryboardInfo.ts`. Each fixture supplies `LegacyDecodeContext` with provenance/source,
`mode`, outer duration, `shouldGenerateImage`, prompt/image availability, associated IDs, and project.
The arbitrary edit must become read-only `legacy-opaque-single-shot`; no absent field is fabricated.
Every legacy success asserts its exact `legacyGrammar`; native V2 success asserts that
`legacyGrammar` is absent. The success result is discriminated by `source`, so V2 can never carry a
legacy grammar label.

- [ ] **Step 2: Run and confirm failure**

```bash
yarn vitest run src/lib/videoDesc/videoDesc.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement strict schemas**

```ts
export const detailedShotSchema = z.object({
  sourceRow: z.number().int().positive(),
  description: z.string().min(1),
  scene: z.string().optional(),
  assetReferences: z.array(z.object({ id: z.number().int().positive(), name: z.string().min(1) }).strict()),
  durationSeconds: z.number().positive(),
  shotSize: z.enum(["extreme-wide", "long-shot", "wide", "medium", "medium-close", "close-up", "extreme-close-up"]),
  cameraMovement: z.enum(["static", "push-in", "pull-back", "pan", "truck", "tracking", "follow", "whip-pan", "crane", "orbit", "high-angle", "low-angle", "handheld", "one-take"]),
  action: z.string().optional(),
  orientation: z.string().optional(),
  spatialRelation: z.string().optional(),
  emotion: z.string().optional(),
  dialogue: z.object({ kind: z.enum(["spoken", "inner-monologue", "voiceover", "none"]), text: z.string(), speakerAssetId: z.number().int().optional() }).strict(),
  soundEffects: z.array(z.string())
}).strict();
```

Build `videoDescV2Schema` as a strict discriminated union. `text-multi-reference-group` owns
`groupDurationSeconds`, optional carry-over, and one-or-more detailed shots; `single-shot` owns one
detailed shot; `storyboard-assisted` owns only its current-item reference and optional guidance, and
does not fabricate detailed shot fields. A separate strict `legacyOpaqueSingleShotSchema` contains
only `{ unit, raw, readOnly: true }` and is never agent-writable.

`serializeVideoDesc()` validates semantic invariants, then constructs a new object in the fixed
property order defined in the spec (including each shot and dialogue) before `JSON.stringify()`.
Make the dialogue, carry-over, storyboard-reference, shot, and top-level objects `.strict()`. Require
For `text-multi-reference-group` only, require
`Math.abs(groupDurationSeconds - sum(shots[].durationSeconds)) <= 1e-9` and unique, strictly
increasing `sourceRow` values. `single-shot` validates its singular `shot`; storyboard-assisted and
opaque records expose neither duration nor detailed-shot arrays. Map custom Zod issues named
`DURATION_MISMATCH`, `DUPLICATE_SOURCE_ROW`,
`NON_MONOTONIC_SOURCE_ROW`, `SINGLE_SHOT_CARDINALITY`, `STORYBOARD_ASSISTED_CARDINALITY`,
reference-integrity issue to the same public code; map every other Zod issue to `INVALID_V2`.

Before generic union failure mapping, recognize malformed discriminants: a `single-shot` without
exactly one singular `shot` maps to `SINGLE_SHOT_CARDINALITY`; a `storyboard-assisted` record without
its exact current-item reference or with substituted detailed shots maps to
`STORYBOARD_ASSISTED_CARDINALITY`. Keep every branch strict and test valid counterparts plus unknown
keys.

Validate reference IDs as positive and unique. At persistence and request preparation, require every
reference to be a subset of `associateAssetsIds`, owned by the project, and an exact database
name/ID match; dialogue speakers must be referenced role assets. Add one test for every error code
and reject unknown keys in every nested schema.

- [ ] **Step 4: Implement quarantined explicit legacy decoders**

```ts
const CARRY_PREFIX = "承接上镜：";
const GROUP_MARKER = "该组分镜行原文：";
const ROW = /^序号(\d+)$/;
const SOUND_PREFIX = "音效：";
```

Select a decoder only from `LegacyDecodeContext`, then parse the known grammar explicitly. The
marker/pipe decoder consumes optional carry-over and exactly six fields; the Markdown decoder handles
numeric rows and leading/trailing pipes; the ideographic-comma decoder handles exactly 12 fields;
the first/last and storyboard-assisted decoders use mode/image/prompt provenance. Closed alias maps
include `大远景/大全景`, `远景`, `全景`, `中景`, `中近景/近景`, `特写`, `大特写`,
`推/推进/缓推`, `拉/拉远/缓拉`, `摇/摇镜`, `移`, `俯拍`, `仰拍`, `固定/静止`,
`跟踪/跟拍`, `甩镜`, `升降`, `环绕`, `手持微晃`, and `一镜到底`. Unknown manual text is
wrapped read-only and never guessed or sent through a detailed-shot schema. Return typed errors; do
not invoke a model.

Task 1 is decoder-fixture compatible only. It must not claim route-level read compatibility: the
single/batch service adapters and atomic compatibility release gate land in Task 6.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/lib/videoDesc/videoDesc.test.ts
yarn lint
git add src/lib/videoDesc
git commit -m "feat(video): add locale-neutral videoDesc v2"
```

---

### Task 2: Make the production agent emit v2 objects

**Files:**

- Modify: `src/agents/productionAgent/tools.ts`
- Modify: `src/agents/productionAgent/tools.test.ts`
- Modify: `src/routes/production/storyboard/addStoryboard.ts`
- Modify: `src/routes/production/storyboard/batchAddStoryboardInfo.ts`
- Modify: `src/routes/production/storyboard/editStoryboardInfo.ts`
- Create: `src/routes/production/storyboard/videoDescIngestion.ts`
- Create: `src/routes/production/storyboard/videoDescIngestion.test.ts`
- Modify: `src/i18n/locales/{en,vi,zh}.json`
- Modify: `data/skills/production_execution_storyboard_panel.{md,en.md,vi.md}`

**Interfaces:** `add_flowData_storyboard` accepts only the strict V2 discriminated union. Legacy and
manual string ingestion is available only through the provenance-aware server routes, which decode,
wrap read-only, or reject before persistence.

- [ ] **Step 1: Add a failing socket test**

Call the tool with v2 and assert:

```ts
expect(JSON.parse(sent.videoDesc)).toMatchObject({
  schema: "toonflow.video-desc/v2",
  shots: [{ sourceRow: 1 }]
});
```

- [ ] **Step 2: Change the tool boundary**

```ts
const storyboardVideoDescInputSchema = videoDescV2Schema;
const serializedVideoDesc = serializeVideoDesc(raw.videoDesc);
```

Use `serializedVideoDesc` in the socket payload. Update all locale descriptions to name the V2
schema and forbid positional pipe or raw text for new writes. A test passes a string through the LLM
tool boundary and proves Zod rejects it before socket emission.

`addStoryboard.ts`, `batchAddStoryboardInfo.ts`, and `editStoryboardInfo.ts` call a separate
`ingestStoredVideoDesc({ raw, provenance, mode, outerDuration, shouldGenerateImage, prompt, src,
associateAssetsIds, projectId })`. Known legacy input is normalized only when lossless for its
grammar; arbitrary manual text is persisted as its original bytes with read-only opaque metadata;
invalid structured input is rejected. The agent cannot reach this compatibility path.

- [ ] **Step 3: Rewrite all three producer skills**

Specify each mode explicitly:

- `text-multi-reference-group`: one persisted v2 object per storyboard group; `shots[]` contains every row in that group; no `storyboardReference`.
- `single-shot`: one persisted V2 object per storyboard row with the singular `shot` field and no
  `groupDurationSeconds`, `shots`, or `storyboardReference`.
- `storyboard-assisted`: one persisted V2 object per storyboard row containing only
  `storyboardReference: { source: "current-item" }` and optional guidance. It does not fabricate a
  detailed shot; the tool cannot name a database id before it creates the row.

Preserve table order and place same-scene continuity in the detailed group's
`carryOver.priorEndState`. English prose/examples contain no Chinese markers or Chinese example
data. Add one valid tool-call example for each unit and schema-validation tests proving fields from
another discriminant are rejected.

```ts
const textGroup = { ...base, unit: "text-multi-reference-group", shots: [row1, row2] };
const singleShot = { schema: VIDEO_DESC_V2_SCHEMA, unit: "single-shot", shot: row1 };
const storyboardAssisted = { schema: VIDEO_DESC_V2_SCHEMA, unit: "storyboard-assisted", storyboardReference: { source: "current-item" } };
```

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/agents/productionAgent/tools.test.ts
yarn lint
git add src/agents/productionAgent/tools.ts src/agents/productionAgent/tools.test.ts src/routes/production/storyboard src/i18n/locales data/skills/production_execution_storyboard_panel.md data/skills/production_execution_storyboard_panel.en.md data/skills/production_execution_storyboard_panel.vi.md
git commit -m "feat(video): emit videoDesc v2 from production agent"
```

---

### Task 3: Build contract-discriminated request serializers

**Files:**

- Create: `src/lib/videoPrompt/input.ts`
- Create: `src/lib/videoPrompt/input.test.ts`
- Create: `src/lib/videoPrompt/legacyCustomSerializer.ts`
- Create: `src/lib/videoPrompt/legacyCustomSerializer.test.ts`

**Interfaces:**

```ts
export interface VideoPromptInputV2 {
  contract: "toonflow.video-prompt-input/v2";
  model: { name: string; mode: string };
  assets: Array<{ id: number; type: "role" | "scene" | "prop" | "clip" | "audio"; name: string; filePath: string; referenceRole: "visual-subject" | "visual-scene" | "visual-prop" | "video-reference" | "audio-reference"; audioAssetId?: number }>;
  storyboardGroups: Array<{
    storyboardId: number;
    duration: number | null;
    videoDesc: VideoDescV2;
    resolvedStoryboardReference?: { storyboardId: number };
  }>;
}

export interface LegacyCompatPromptInputV1 {
  contract: "toonflow.video-prompt-input/legacy-v1";
  model: { name: string; mode: string };
  rows: Array<{ storyboardId: number; provenance: LegacyGrammar | "manual-opaque"; rawOpaqueProjection: string }>;
}

export interface LegacyCustomPromptRequest {
  contract: "toonflow.video-prompt-input/legacy-v1-custom";
  bytes: string;
}

export interface LegacyCustomSerializerArgs {
  labels: { model: string; assets: string; storyboard: string };
  modelName: string;
  references: readonly TrustedPromptReference[];
  rows: ReadonlyArray<{ videoDesc: string; duration: string | number | null }>;
}

export interface TrustedPromptReference {
  readonly id: number;
  readonly projectId: number;
  readonly type: "role" | "scene" | "prop" | "clip" | "audio";
  readonly name: string;
  readonly filePath: string;
  readonly referenceRole: "visual-subject" | "visual-scene" | "visual-prop" | "video-reference" | "audio-reference";
  readonly __trustedPromptReference: unique symbol;
}

export type VideoPromptInputErrorCode = VideoDescParseErrorCode | "MISSING_OUTER_DURATION" | "OUTER_DURATION_MISMATCH";
export type BuildVideoPromptInputResult =
  | { ok: true; kind: "v2-json"; inputContract: "toonflow.video-prompt-input/v2"; value: VideoPromptInputV2; userMessage: string }
  | { ok: true; kind: "legacy-compat-json"; inputContract: "toonflow.video-prompt-input/legacy-v1"; value: LegacyCompatPromptInputV1; userMessage: string }
  | { ok: true; kind: "legacy-custom-bytes"; inputContract: "toonflow.video-prompt-input/legacy-v1-custom"; value: LegacyCustomPromptRequest; userMessage: string }
  | { ok: false; code: VideoPromptInputErrorCode; message: string; storyboardIndex?: number };

export function buildV2PromptInput(args: {
  modelName: string;
  mode: string;
  references: readonly TrustedPromptReference[];
  storyboards: Array<{ id: number; videoDesc: string; duration: string | number | null; shouldGenerateImage: number | string | null; prompt: string | null; filePath: string | null; associateAssetsIds: number[] }>;
}): BuildVideoPromptInputResult;
export function buildLegacyCompatInput(args: { modelName: string; mode: string; rows: ParsedLegacyRow[] }): BuildVideoPromptInputResult;
export function serializeLegacyCustomRequest(args: LegacyCustomSerializerArgs): BuildVideoPromptInputResult;
```

- [ ] **Step 1: Write failing tests**

Build legacy and V2 compatibility cases from the same recoverable normalized fixture. Do not enrich
only the V2 side with fields absent from the historical grammar.

```ts
const legacy = "该组分镜行原文：序号1 | A opens the safe. | 3 | 中景 | 固定 | | 音效：dial clicks";
const recoverableValue: VideoDescV2 = {
  ...value,
  carryOver: undefined,
  shots: [{
    ...value.shots[0],
    description: "A opens the safe.",
    scene: undefined,
    assetReferences: [{ id: 102, name: "safe" }],
    action: undefined,
    orientation: undefined,
    spatialRelation: undefined,
    emotion: undefined,
    soundEffects: ["dial clicks"],
  }],
};
const equivalentV2 = serializeVideoDesc(recoverableValue);
const legacyInput = { id: 7001, duration: 3, videoDesc: legacy, shouldGenerateImage: 0, prompt: null, filePath: null, associateAssetsIds: [102] };
const baseArgs = {
  modelName: "seedance-2.0",
  mode: "text-multi-reference-group",
  references: [trustedReference({ id: 102, projectId: 9, type: "prop", name: "safe", filePath: "/fixtures/safe.png", referenceRole: "visual-prop" })],
  storyboards: [legacyInput],
};

it("builds identical canonical recoverable projections for equivalent legacy and v2 rows", () => {
  const oldResult = buildV2PromptInput(baseArgs);
  const v2Result = buildV2PromptInput({ ...baseArgs, storyboards: [{ ...legacyInput, videoDesc: equivalentV2 }] });
  expect(canonicalRecoverableProjection(oldResult)).toEqual(canonicalRecoverableProjection(v2Result));
});
it("documents legacy defaults and loss separately", () => {
  expect(legacyCompatibilityLoss(buildV2PromptInput(baseArgs))).toEqual({ scene: "absent", references: "outer-associations-only" });
});
it("preserves storyboard order and special characters", () => {
  const first = serializeVideoDesc({ ...value, groupDurationSeconds: 3, carryOver: undefined, shots: [{ ...value.shots[0], description: "A says 'open | now <quietly>'" }] });
  const second = serializeVideoDesc({ ...value, groupDurationSeconds: 3, carryOver: undefined, shots: [{ ...value.shots[0], description: "B waits" }] });
  const result = assertOk(buildV2PromptInput({ ...baseArgs, storyboards: [{ ...legacyInput, videoDesc: first }, { ...legacyInput, id: 7002, videoDesc: second }] }));
  expect(JSON.parse(result.userMessage).storyboardGroups.map((group: any) => [group.storyboardId, group.videoDesc.shots[0].description])).toEqual([[7001, "A says 'open | now <quietly>'"], [7002, "B waits"]]);
});
it("returns the structured parser code with storyboardIndex", () => expect(buildV2PromptInput({ ...baseArgs, storyboards: [{ ...legacyInput, id: 42, videoDesc: '{"schema":"toonflow.video-desc/v2"}' }] })).toMatchObject({ ok: false, code: "INVALID_V2", storyboardIndex: 0 }));
it("returns MISSING_OUTER_DURATION for a text group with null duration", () => expect(buildV2PromptInput({ ...baseArgs, storyboards: [{ ...legacyInput, id: 42, duration: null, videoDesc: equivalentV2 }] })).toMatchObject({ ok: false, code: "MISSING_OUTER_DURATION" }));
it("returns OUTER_DURATION_MISMATCH for a text group duration mismatch", () => expect(buildV2PromptInput({ ...baseArgs, storyboards: [{ ...legacyInput, id: 42, duration: 4, videoDesc: equivalentV2 }] })).toMatchObject({ ok: false, code: "OUTER_DURATION_MISMATCH" }));
it("emits no XML or legacy marker prose", () => expect(assertOk(buildV2PromptInput(baseArgs)).userMessage).not.toMatch(/<storyboardItem|该组分镜行原文|序号1/));
```

Add separate fixtures for the other success branches. `buildLegacyCompatInput()` returns canonical
JSON with `contract: "toonflow.video-prompt-input/legacy-v1"`, ordered provenance, and byte-identical
`rawOpaqueProjection`; it never returns a V2 group. `serializeLegacyCustomRequest()` returns the
current XML-like bytes under `contract: "toonflow.video-prompt-input/legacy-v1-custom"` and never
returns compat JSON.

Capture the current single and batch request bytes from `generateVideoPrompt.ts` and
`batchGeneratePrompt.ts` before refactoring and lock them as golden fixtures. The serializer preserves
the exact localized label values, model line, blank lines/indentation, filtered asset order and
`[id,type,name audio:id ] ` formatting, ideographic-comma asset separator, storyboard order,
implicit comma between mapped storyboard items, `<storyboardItem` line breaks, single-quoted
`videoDesc`/`duration` attributes, raw values, and trailing whitespace. Existing `useData`, explicit
locale-pinned, and custom `legacy-v1` prompts receive those identical bytes until explicitly
migrated. Tests compare complete strings for one single and one multi-storyboard request; no parsed
or normalized comparison is sufficient.

- [ ] **Step 2: Implement parse-before-serialize behavior**

Loop through storyboards, call `parseStoredVideoDesc()` with the full provenance context, and retain each outer `id`. For text groups,
return `MISSING_OUTER_DURATION` when outer `duration` is null/non-numeric and
`OUTER_DURATION_MISMATCH` when it differs from `groupDurationSeconds`; do not compare outer duration
for units whose grammar lacks that invariant. Resolve storyboard-assisted `{ source: "current-item" }`
to the outer id only in `resolvedStoryboardReference`. Return the first row-indexed error and
preserve the trusted reference vocabulary supplied by Task 6.

The pure builders accept only branded `TrustedPromptReference` values and perform deterministic
schema/order/serialization checks. They do not receive `projectId`, selection IDs, raw DB rows, or
client-supplied names/paths and cannot claim ownership/file validation. Seedance text multi-reference
numbers only trusted visual asset images, never storyboard images, clips, or audio; universal modes
preserve supported trusted image/video/audio roles. The async Task 6 service owns all lookup and
integrity checks before invoking these builders.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/lib/videoPrompt/input.test.ts src/lib/videoPrompt/legacyCustomSerializer.test.ts
git add src/lib/videoPrompt/input.ts src/lib/videoPrompt/input.test.ts src/lib/videoPrompt/legacyCustomSerializer.ts src/lib/videoPrompt/legacyCustomSerializer.test.ts
git commit -m "feat(video): add contract-specific prompt inputs"
```

---

### Task 4: Lock legacy seed bytes and version prompt-input contracts

**Files:**

- Create: `src/lib/prompts/legacy/videoPromptGenerationEnV1.ts`
- Modify: `src/lib/migrations/promptSeedSync.ts`
- Modify: `src/lib/migrations/promptSeedSync.test.ts`
- Create: `src/lib/prompts/promptInputContract.ts`
- Create: `src/lib/prompts/promptInputContract.test.ts`
- Modify: `src/routes/setting/modelMap/getPromptList.ts`
- Modify: `docs/i18n/prompt-terms.json`
- Modify: `scripts/i18n-check-terms.ts`
- Modify: `scripts/i18n-check-terms.test.ts`

**Interfaces:**

```ts
export type PromptInputContract = "legacy-v1" | "video-prompt-input/v2";
export type RuntimePromptContract = "legacy-v1-compat" | "legacy-v1" | "video-prompt-input/v2";
export type RowContractClassification =
  | { ok: true; contract: PromptInputContract; rowContracts: PromptInputContract[] }
  | { ok: false; code: "MIXED_PROMPT_INPUT_CONTRACTS"; storyboardIndices: number[] };
export function classifyVideoPromptRows(rows: ParsedStoredStoryboard[]): RowContractClassification;
export function resolveCompatiblePrompt(args: {
  classification: Extract<RowContractClassification, { ok: true }>;
  binding: PromptBinding | null;
}): CompatiblePromptResult; // default legacy-v1 rows resolve only to shipped legacy-v1-compat
```

- [ ] **Step 1: Extract the locked seed before any Task 5 rewrite**

Mechanically extract `videoPromptGeneration.en` from pinned base commit
`8c8c2e917ce714b18dd588ba13d6553a99e6a71b`, not from a working tree whose template may already
have changed. Verify byte identity:

```ts
expect(LEGACY_VIDEO_PROMPT_GENERATION_EN_V1.length).toBe(37851);
expect(sha256(LEGACY_VIDEO_PROMPT_GENERATION_EN_V1)).toBe("9fc6b347e12977d89cf3798fae89b2182b9f636584e9d913021391633ca7fa6a");
```

Add it to guarded legacy variants. An untouched old English row updates; a one-character edit,
non-null `useData`, pinned file, or custom prompt remains byte-identical.

`LEGACY_VIDEO_PROMPT_GENERATION_EN_V1` is recognition/migration source data only. Its known 1,133
Han characters make it ineligible for any English runtime request. Export no runtime resolver for
it, keep it outside prompt lists, and add a test proving default, fallback, and explicit shipped-path
resolution can never return those locked bytes.

- [ ] **Step 2: Version every prompt input contract**

Shipped rewritten V2 templates declare `video-prompt-input/v2`. Task 5 also ships a new
`legacy-v1-compat` prompt/adapter in exact `en`, `vi`, and `zh` variants. Task 6 first classifies rows:
first/last free-form and opaque historical rows require the compat adapter; V2-capable rows require a
V2 prompt; mixed batches fail. The automatic/default legacy path always chooses the new exact-locale
compat prompt and never the locked old seed, regardless of the model's shipped V2 default.

Existing `o_prompt.useData`, pinned files, and custom prompts default to the older `legacy-v1`
contract and are not silently rewritten. They may run only when explicitly selected as a user
override for legacy-compatible rows; the API/UI returns a localized warning that authored-language
purity is not guaranteed. They never become an automatic fallback. No legacy request silently
receives the V2 JSON envelope and no V2 request receives legacy input. Add language-policy/contract
metadata to list/binding results plus migration preview. Tests cover safe compat fallback under a V2
default, explicit custom legacy override plus warning, V2/V2, incompatible pairings, mixed batches,
old-seed non-selection, upgrade preservation, and opt-in migration.

- [ ] **Step 3: Quarantine registry terms**

Mark carry-over, group-row, row-number, inline carry-over, and sound-prefix markers as
`legacy-decode-only`; remove their English prompt occurrence requirements. Provider evidence stays
separate. `findUnexpectedHan()` returns `string[]`; an empty array is clean.

```ts
expect(findUnexpectedHan("Use @图片1 only.", ["@图片1"])).toEqual([]);
expect(findUnexpectedHan("Use 承接上镜 as a prefix.", ["@图片1"])).toEqual(["承接上镜"]);
```

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/lib/migrations/promptSeedSync.test.ts src/lib/prompts/promptInputContract.test.ts scripts/i18n-check-terms.test.ts
yarn i18n:check-terms
git add src/lib/prompts/legacy/videoPromptGenerationEnV1.ts src/lib/prompts/promptInputContract.ts src/lib/prompts/promptInputContract.test.ts src/lib/migrations/promptSeedSync.ts src/lib/migrations/promptSeedSync.test.ts src/routes/setting/modelMap/getPromptList.ts docs/i18n/prompt-terms.json scripts/i18n-check-terms.ts scripts/i18n-check-terms.test.ts
git commit -m "test(video): lock legacy prompt contract"
```

---

### Task 5: Rewrite shipped video templates with explicit input contracts

**Files:**

- Modify: `data/modelPrompt/video/seedance2Multi-parameterMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/universalMulti-parameterMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/universalFirstAndLastFrameMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/wan2.6Single-imageFirstFrameMode.{md,en.md,vi.md}`
- Create: `data/modelPrompt/video/legacy-v1-compat.md`
- Create: `data/modelPrompt/video/legacy-v1-compat.vi.md`
- Create: `data/modelPrompt/video/legacy-v1-compat.zh.md`
- Modify: `data/modelPrompt/.i18n-source-locales.json`
- Modify: `src/lib/prompts/videoPromptGeneration.ts`
- Create: `src/lib/prompts/legacyVideoPromptCompat.ts`
- Create: `src/lib/prompts/legacyVideoPromptCompat.test.ts`
- Modify: `src/lib/prompts/index.test.ts`
- Create: `src/lib/videoPrompt/providerTokens.ts`
- Create: `src/lib/videoPrompt/providerTokens.test.ts`
- Create: `src/lib/videoPrompt/output.ts`
- Create: `src/lib/videoPrompt/output.test.ts`
- Create: `docs/i18n/provider-protocol.json`
- Create: `docs/i18n/provider-evidence/README.md`
- Create: `scripts/i18n-capture-provider-evidence.ts`
- Create: `scripts/i18n-capture-provider-evidence.test.ts`
- Create: `scripts/i18n-check-provider-protocol.ts`
- Create: `scripts/i18n-check-provider-protocol.test.ts`
- Modify: `package.json`

**Interfaces:** The four rewritten shipped template families—Seedance multi-parameter, universal
multi-parameter, universal first/last-frame, and Wan 2.6 single-image first-frame—declare and consume
only `toonflow.video-prompt-input/v2`. The new exact-locale `legacy-v1-compat` template declares and
consumes only `toonflow.video-prompt-input/legacy-v1`, whose envelope contains provenance plus the
read-only raw opaque projection as verbatim data. It does not consume the V2 storyboard-group shape.
Task 6's row classifier and prompt-contract resolver are the only selectors: they may choose compat
only for homogeneous legacy-compatible rows and a V2 template only for homogeneous V2-capable rows.

- [ ] **Step 1: Add failing purity tests**

```ts
const seedanceEn = path.join(videoPromptDir, "seedance2Multi-parameterMode.en.md");
const seedanceVi = path.join(videoPromptDir, "seedance2Multi-parameterMode.vi.md");
const universalEn = path.join(videoPromptDir, "universalMulti-parameterMode.en.md");
const universalVi = path.join(videoPromptDir, "universalMulti-parameterMode.vi.md");
const legacyCompatEn = path.join(videoPromptDir, "legacy-v1-compat.md");
const legacyCompatVi = path.join(videoPromptDir, "legacy-v1-compat.vi.md");

expect(stripStaticProviderTokens(readFileSync(seedanceEn, "utf8"), "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(seedanceVi, "utf8"), "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(universalEn, "utf8"), "universal-multi-reference", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(universalVi, "utf8"), "universal-multi-reference", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(videoPromptGeneration.en, "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(videoPromptGeneration.vi, "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripAllVerifiedStaticProviderTokens(readFileSync(legacyCompatEn, "utf8"), verifiedEvidenceSet)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripAllVerifiedStaticProviderTokens(readFileSync(legacyCompatVi, "utf8"), verifiedEvidenceSet)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripAllVerifiedStaticProviderTokens(legacyVideoPromptCompat.en, verifiedEvidenceSet)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripAllVerifiedStaticProviderTokens(legacyVideoPromptCompat.vi, verifiedEvidenceSet)).not.toMatch(/[\u3400-\u9fff]/);

const declaredContracts = new Map([
  ["seedance2Multi-parameterMode", "toonflow.video-prompt-input/v2"],
  ["universalMulti-parameterMode", "toonflow.video-prompt-input/v2"],
  ["universalFirstAndLastFrameMode", "toonflow.video-prompt-input/v2"],
  ["wan2.6Single-imageFirstFrameMode", "toonflow.video-prompt-input/v2"],
  ["legacy-v1-compat", "toonflow.video-prompt-input/legacy-v1"],
]);
expect(readDeclaredTemplateContracts()).toEqual(declaredContracts);
expect(() => prepareTemplateRequest("legacy-v1-compat", v2Envelope)).toThrow("PROMPT_INPUT_CONTRACT_INCOMPATIBLE");
expect(() => prepareTemplateRequest("seedance2Multi-parameterMode", legacyEnvelope)).toThrow("PROMPT_INPUT_CONTRACT_INCOMPATIBLE");
```

For every locale variant, tests parse the declared contract metadata and capture the actual user
message delivered beside that template. Each of the four V2 families receives only an object whose
`contract` is `toonflow.video-prompt-input/v2`; each compat variant receives only
`toonflow.video-prompt-input/legacy-v1` with the opaque raw projection byte-identical. Missing,
mismatched, or unadvertised contracts fail before provider invocation. The resolver test exercises
both directions so a template can neither advertise one contract nor receive the other.

`stripStaticProviderTokens()` escapes the evidence-backed `staticPlaceholderTokens` and replaces only
their single `N` slot with `(?:N|\d+)`; it never strips a bare prefix. At runtime,
`buildProviderTokens(family, assets, verifiedProtocol)` returns the exact tokens for the actual
request cardinality and type order (for example, `@图片1`, `@图片2`, `<主体1>`, and `<场景1>`).
Test that a one-asset allowlist rejects `@图片2`; never exempt fragments such as `@图片` or `<主体`.

Expected now: fail against 823 Han in the Seedance file; the separately scanned locked recognition
seed contains 1,133 Han and is asserted non-runnable rather than accepted by any runtime purity gate.

The 1,133-Han old fallback is not translated in place or executed; Task 4 preserves it solely for
hash recognition. The new compat prompt is authored independently in strict English, Vietnamese,
and Chinese. Its English/Vietnamese instructions contain no Han after stripping only evidence-backed
complete provider tokens. It accepts a versioned legacy envelope with opaque raw text classified as
verbatim data, preserves that text byte-for-byte, and never asks the model to parse application-
authored Chinese marker prose. Exact-locale resolution fails closed when a compat variant is missing.
Register its canonical `.md` as `sourceLocale: "en"` with `vi`/`zh` translations in the model-prompt
source map.

- [ ] **Step 2: Replace parsing prose with the v2 contract**

The English template must state:

```md
The user message is one JSON object whose contract is toonflow.video-prompt-input/v2.
Every storyboard group contains one discriminated videoDesc unit. Text groups contain `shots`,
single-shot units contain `shot`, and storyboard-assisted units contain only their reference/guidance.
Do not split text on punctuation, pipes, markers, or row labels, and never invent fields absent from
the selected unit.

Return one complete prompt with exactly three semantic parts:
1. Subject and reference definitions.
2. Every input shot in group order and sourceRow order; apply carryOver once before its group's first shot.
3. Style and constraint package.

All generated labels, connective text, constraints, and style prose are English. Preserve quoted
runtime data unchanged.
```

Use English section labels (`Previous-shot continuity`, `Shot N`, `No dialogue`, `voice`) and
English style prose. The Vietnamese file uses Vietnamese labels/style prose and an otherwise
locale-neutral JSON example. Neither variant contains Chinese parser/example prose.

For Seedance text multi-reference mode, allocate the selected verified image token (candidate A is
`@图片N`) only to visual image entries (`role`, `scene`, `prop`) in the envelope's `assets` array.
Do not number storyboard images, `clip`/video, or audio; do not derive reference numbers from
`storyboardGroups`; and do not use legacy `prompt`, `src`, or `shouldGenerateImage` fields as visual
material. Universal modes retain the valid explicit image/video/audio reference roles.

For the four V2 template families, flatten all groups in array order and each group's shots in `sourceRow` order. Assign one global
output ordinal (`Shot 1`, `Shot 2`, ...) so rows that restart at 1 in a later group remain unique.
Retain `(groupIndex, sourceRow)` internally for traceability, but emit subject definitions and the
style/constraint section only once for the complete prompt.

- [ ] **Step 3: Preserve other model outputs while changing their inputs**

Universal multi-reference retains exactly `[References]` followed by one `[Instruction]` block.
Universal first/last-frame retains `[Visual]`, `[Motion]`, `[Camera]`, `[Audio]`, and `[Narrative]`.
Wan single-image retains its unnumbered narrative sequence: style keynote; subject/action; scene;
light/atmosphere; dialogue; sound; camera wrap-up. Their Vietnamese variants preserve the same
structural labels/order with Vietnamese instructional prose. All read named v2 fields; remove XML,
ideographic-comma, marker, and positional parsing from every en/vi variant.

Add a static template-contract test whose fixture contains three assets and two groups/four shots.
Assert the template explicitly says: asset-only numbering; no storyboard-image allocation; one
subject-definition part; one style part; global shot ordinals; and four ordered shot entries. This
test validates the authored contract, not nondeterministic LLM output. Provider/integration QA under
the spend gate validates actual generated output.

Define output validation per selected contract:

- `video-prompt-input/v2` uses strict Zod/tool output with `subjectDefinitions`, ordered shot objects
  containing global ordinal/group index/source row/semantic text/dialogue, and `styleConstraints`.
  Validate exact shot count/order, traceability, and byte-identical dialogue; then
  `renderVideoPromptOutput()` deterministically emits the three-part prompt.
- Shipped `legacy-v1-compat` uses a separate strict schema
  `{ prompt: nonempty string, rawOpaqueProjection: nonempty string }`. The projection must equal the
  input bytes. This schema forbids and never fabricates `sourceRow`, dialogue, ordinals, subject
  definitions, or detailed-shot guarantees.
- Explicit custom/useData/pinned `legacy-v1` keeps current raw text output behavior: require only the
  provider's nonempty text and persist it without either structured renderer. This warned override
  is not validated as shipped authored prose.

`selectVideoPromptOutputValidator(runtimePromptContract)` is exhaustive and fails on unknown or
mismatched contracts. Tests exercise all three validators, both cross-validator directions, strict
extra/missing compat fields, raw-projection byte mismatch, empty custom text, and an opaque Han row;
they assert no opaque result contains fabricated `sourceRow` or dialogue and no DB update occurs on
validation failure.

- [ ] **Step 4: Verify and record the provider protocol before release**

Local implementation may proceed with candidate fixtures, but the final provider-protocol gate and
release remain blocked until the user approves provider access, credentials, and a spend cap.
Evidence is produced only by `i18n-capture-provider-evidence`, never by hand-attested JSON. For every
family and every selected configured provider/model, the harness stores the exact request, input
asset files and SHA-256 hashes, seed, provider response, output artifacts, evaluator result, and
artifact hashes. The evidence index has this shape:

```ts
interface ProviderProtocolEvidence {
  schema: "toonflow.provider-protocol/v1";
  families: Record<"seedance2-text-multi" | "universal-multi-reference", {
    entries: Array<{
      identity: {
        family: "seedance2-text-multi" | "universal-multi-reference";
        vendor: string;
        model: string;
        modelVersion: string;
        configFingerprint: string;
      };
      templateHash: string;
      tokenBuilderHash: string;
      verifiedAt: string;
      status: "verified";
      selectedSyntax: "han" | "english";
      staticPlaceholderTokens: string[];
      testCaseId: string;
      assetCount: number;
      observedBindings: Array<{ token: string; assetId: number; bound: boolean }>;
      requestArtifact: { path: string; sha256: string };
      responseArtifact: { path: string; sha256: string };
      outputArtifacts: Array<{ path: string; sha256: string }>;
      evaluatorArtifact: { path: string; sha256: string; passed: true };
    }>;
  }>;
}
```

Then run controlled reference-binding comparisons with identical assets and seed. Seedance 2.0
compares:

- A: `@图片N`, `<主体N>`, `<场景N>`, `<道具N>`.
- B: `@imageN`, `<subjectN>`, `<sceneN>`, `<propN>`.

Universal multi-reference compares its current complete `@图N` form with `@imageN`. First/last-frame
and Wan templates declare no in-prompt reference tokens and therefore need no Han exception.

If B binds every asset reliably, use English aliases and keep no Han allowlist. Otherwise retain only
A. Record all harness artifacts under `docs/i18n/provider-evidence/`. Runtime token selection receives
the active vendor/model/version/config fingerprint and fails closed unless it matches that exact
family's evidence. Evidence from one family or configured model cannot authorize another. Staleness
is deterministic: identity/config/template/token-builder hash mismatch invalidates evidence;
`verifiedAt` is ISO audit metadata and has no arbitrary wall-clock expiry. The checker rehashes every
artifact and validates every binding. Tests cover tampering, missing artifacts, provider/model/
version/config/family mismatch, template/token-builder changes, cross-family reuse, and malformed
timestamps. Add two verified entries in the same family with distinct vendor/model/config identities;
runtime selection must choose only the exact composite identity and reject ambiguous, partial, or
cross-entry matches.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/lib/prompts/index.test.ts src/lib/prompts/legacyVideoPromptCompat.test.ts src/lib/videoPrompt/providerTokens.test.ts src/lib/videoPrompt/output.test.ts scripts/i18n-capture-provider-evidence.test.ts scripts/i18n-check-provider-protocol.test.ts
yarn i18n:check-provider-protocol
git add data/modelPrompt/video data/modelPrompt/.i18n-source-locales.json src/lib/prompts/videoPromptGeneration.ts src/lib/prompts/legacyVideoPromptCompat.ts src/lib/prompts/legacyVideoPromptCompat.test.ts src/lib/prompts/index.test.ts src/lib/videoPrompt/providerTokens.ts src/lib/videoPrompt/providerTokens.test.ts src/lib/videoPrompt/output.ts src/lib/videoPrompt/output.test.ts docs/i18n/provider-protocol.json docs/i18n/provider-evidence scripts/i18n-capture-provider-evidence.ts scripts/i18n-capture-provider-evidence.test.ts scripts/i18n-check-provider-protocol.ts scripts/i18n-check-provider-protocol.test.ts package.json
git commit -m "feat(video): consume structured video prompt input"
```

---

### Task 6: Share one generation service between single and batch routes

**Files:**

- Create: `src/services/videoPromptGeneration.ts`
- Create: `src/services/videoPromptGeneration.test.ts`
- Create: `src/repositories/videoPromptReferences.ts`
- Create: `src/repositories/videoPromptReferences.test.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.test.ts`
- Modify: `src/routes/production/workbench/batchGeneratePrompt.ts`
- Create: `src/routes/production/workbench/batchGeneratePrompt.test.ts`

**Interfaces:**

```ts
export async function prepareVideoPromptRequest(args: {
  projectId: number;
  model: string;
  mode: string;
  info: Array<{ id: number; sources: "storyboard" | "assets" }>;
  promptLocale: Locale;
}): Promise<
  | { ok: true; request: { system: string; assistant: string; user: string; outputMode: "v2-structured" | "legacy-compat-structured" | "legacy-custom-raw" }; inputKind: "v2-json" | "legacy-compat-json" | "legacy-custom-bytes"; rowContract: "legacy-v1" | "video-prompt-input/v2"; runtimePromptContract: "legacy-v1-compat" | "legacy-v1" | "video-prompt-input/v2"; overrideWarning?: string }
  | { ok: false; code: VideoPromptInputErrorCode | "STORYBOARD_NOT_FOUND" | "PROMPT_TEMPLATE_NOT_FOUND" | "PROMPT_INPUT_CONTRACT_INCOMPATIBLE" | "MIXED_PROMPT_INPUT_CONTRACTS" | "REFERENCE_DUPLICATE_ID" | "REFERENCE_UNKNOWN_ASSET" | "REFERENCE_NAME_MISMATCH" | "REFERENCE_NOT_ASSOCIATED" | "REFERENCE_WRONG_PROJECT" | "DIALOGUE_SPEAKER_NOT_REFERENCED" | "REFERENCE_FILE_MISSING"; storyboardIndex?: number; storyboardIndices?: number[]; detail: string }
>;
```

- [ ] **Step 1: Establish the atomic route-level compatibility gate**

Replay every real captured Task 1 historical fixture through both single and batch route preparation:
marker/pipe, leading/trailing-pipe Markdown rows, 12-field ideographic-comma, first/last free form,
storyboard-assisted fixed text, and arbitrary manual edit. Detailed grammars that normalize
losslessly build the V2 envelope; first/last free-form and opaque rows automatically use the new
strict exact-locale `legacy-v1-compat` adapter. Assert each group appears once in order and neither V2 route emits
XML, `join("，")`, or legacy marker prose on shipped V2/compat paths. The explicit custom
`legacy-v1` path instead matches Task 3's byte-exact XML-like golden serializer. Task 6, not Task 1, is the first point at which the plan
may claim route-level read compatibility.

Run the opaque/default route capture with `prompt_language=en`, `vi`, and `zh`; each selects only its
compat variant, and a missing variant fails before invocation. English/Vietnamese authored segments
pass the Han guard after exact evidence-backed token stripping; Han-bearing opaque raw text remains
byte-identical as `verbatim-data` and the model is invoked.

Add a row-contract matrix for both routes: all-V2 plus shipped V2 default succeeds; all-legacy plus
that same default forces the new `legacy-v1-compat` prompt and proves the old locked seed was not
selected; English/Vietnamese route payload captures contain no authored Han after exact provider
tokens are removed while Han-bearing opaque raw text remains byte-identical and invocation occurs.
All-legacy plus an explicitly selected custom legacy prompt succeeds only with a localized override
warning; V2 plus legacy-only binding fails before invocation; legacy plus V2-only explicit binding
cannot replace the compat fallback; and a mixed legacy/V2 batch returns localized
`MIXED_PROMPT_INPUT_CONTRACTS` with row indices and zero provider calls. A legacy row never reaches a
V2 prompt, and a V2 row never reaches the legacy adapter.

- [ ] **Step 2: Extract shared preparation**

Move duplicate asset/storyboard queries, audio binding, row-contract classification,
canonical/pinned/custom prompt resolution,
automatic mode selection, strict localized art-manual lookup, envelope construction, output validation,
and deterministic rendering into the service. The service returns typed, nonlocalized errors. Routes
retain validation, state transitions, HTTP responses, per-track orchestration, and translate every
operational error with `content_language` catalog keys before responding. Parser, reference,
prompt-contract, mixed-contract, and structured-output failures stop before provider invocation or
DB prompt update. Prompt binding provenance never chooses the adapter: classify every row first,
require a homogeneous contract, select shipped exact-locale `legacy-v1-compat` for automatic legacy
fallback, and only then honor an explicitly selected compatible custom `legacy-v1` override with a
warning. The locked recognition seed is never a runtime candidate.

`loadTrustedPromptReferences({ projectId, selectedAssetIds, storyboards })` is the async ownership
boundary. In one consistent snapshot/query transaction it loads selected assets and associations,
checks positive/unique IDs, current-project ownership, exact persisted ID/name, subset of each
storyboard's `associateAssetsIds`, speaker membership, supported modality, and required file
existence, normalizes `tool -> prop`, then constructs the branded immutable trusted records consumed
by the pure builders. The pure builders never query DB/storage or accept raw names/paths.

Repository/service tests cover cross-project selection, wrong name/ID, missing file, duplicate ID,
non-associated reference, invalid dialogue speaker, image/video/audio modality matrices, and storage
lookup failure. Each returns its exact reference-integrity code before serializer/provider invocation;
spies assert zero `Ai.*` calls and zero prompt DB updates.

Route payload tests include Han-bearing verbatim names, descriptions, dialogue, carry-over, and
sound effects; assert byte identity through the request and structured response while invocation
occurs. A neighboring authored Han instruction must fail. Test every reference-integrity error code,
all strict unknown-key failures, mixed image/video/audio modes, and missing files.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/repositories/videoPromptReferences.test.ts src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts
yarn lint
git add src/repositories/videoPromptReferences.ts src/repositories/videoPromptReferences.test.ts src/services/videoPromptGeneration.ts src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.ts src/routes/production/workbench/batchGeneratePrompt.test.ts
git commit -m "refactor(video): centralize prompt request preparation"
```

---

### Task 7: Verify compatibility and generated output

**Files:** Verify Tasks 1–6; change only those files when a test reveals a defect.

- [ ] **Step 1: Run focused and repository suites**

```bash
yarn vitest run src/lib/videoDesc/videoDesc.test.ts src/lib/videoPrompt/input.test.ts src/lib/videoPrompt/legacyCustomSerializer.test.ts src/lib/videoPrompt/providerTokens.test.ts src/lib/videoPrompt/output.test.ts src/lib/prompts/promptInputContract.test.ts src/lib/prompts/legacyVideoPromptCompat.test.ts src/agents/productionAgent/tools.test.ts src/routes/production/storyboard/videoDescIngestion.test.ts src/repositories/videoPromptReferences.test.ts src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts src/lib/prompts/index.test.ts src/lib/migrations/promptSeedSync.test.ts scripts/i18n-check-terms.test.ts scripts/i18n-capture-provider-evidence.test.ts scripts/i18n-check-provider-protocol.test.ts
yarn i18n:check-terms
yarn i18n:check-provider-protocol
yarn lint
yarn test
```

- [ ] **Step 2: Verify forbidden syntax is gone**

```bash
rg -n '承接上镜|该组分镜行原文|序号N|音效：' data/modelPrompt/video/*.en.md
rg -n '<storyboardItem|join\("，"\)' src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/batchGeneratePrompt.ts
```

Expected: no output.

- [ ] **Step 3: Build and inspect generated output**

```bash
yarn build
git diff --check
git status --short
```

Expected: build succeeds; only intended sources and generated `data/serve/app.js` differ; pre-existing `.gstack/` remains untouched.

- [ ] **Step 4: Commit generated server output only when changed**

```bash
git add data/serve/app.js
git commit -m "build: regenerate server for video prompt v2"
```

Skip this commit when `data/serve/app.js` is unchanged.

## Rollout Order

1. Ship Task 1 first after every captured historical family passes decoder-fixture tests. It adds
   parsing types and opaque manual-text representation only; it does not claim route-level read
   compatibility or change writes.
2. Execute Task 4's pinned-base seed extraction and prompt-contract metadata before Task 5 rewrites
   any template. The verified length/hash are immutable review gates.
3. After Task 1 is available, ship Tasks 2–6 atomically in one compatibility release. Task 6's full
   single/batch replay and row-contract matrix are the route-level compatibility gate. The V2-only
   agent, provenance-aware manual ingestion, canonical envelope, versioned prompt adapters, templates,
   structured-output renderer, provider evidence, and shared routes must not be enabled independently.
4. Within that release, deploy normalization before route traffic and keep legacy strings readable
   until every producer and prompt consumer is live.
5. Leave historical rows untouched. Known malformed structured values fail with row index and parser
   code; truly arbitrary manual text stays read-only opaque and is never enriched or agent-written.
6. Label shipped-strict, pinned-locale, and custom-unscoped bindings with language policy and input
   contract; do not rewrite overrides. Fail incompatible V2/legacy bindings before invocation.
