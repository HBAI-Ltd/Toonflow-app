# Video Prompt Contract V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Chinese marker-and-pipe `videoDesc` protocol with versioned, locale-neutral JSON so English video prompt generation contains no Chinese instruction prose and Seedance 2.0 merges all sub-shots into one three-part prompt.

**Architecture:** Store self-describing v2 JSON in the existing `o_storyboard.videoDesc TEXT` column. New agent writes use a typed object; old rows pass through one deterministic legacy decoder. Single and batch generation share one JSON request builder and prompt resolver. The LLM writes semantics; it no longer parses storage syntax.

**Tech Stack:** TypeScript, Zod, Express, Knex/SQLite, Vitest, Markdown model prompts.

**Spec:** `docs/superpowers/specs/2026-08-25-english-prompt-zero-cjk-design.md`

## Global Constraints

- Implement on `codex/video-prompt-contract-v2`, never directly on `master`; push and open a PR after verification.
- `prompt_language=en` permits no Chinese application-authored instruction prose.
- Preserve names, dialogue, descriptions, sound effects, and carry-over text byte-for-byte as runtime data.
- Permit only provider literals verified in Task 4. `@图片N`, `<主体N>`, `<场景N>`, and `<道具N>` are candidate syntax, not an active release exception until the evidence gate passes.
- Do not change the `o_storyboard` schema or bulk-rewrite existing rows.
- Keep direct/manual string writes readable during rollout; normalize before model invocation.
- Preserve `o_prompt.useData` and explicit locale-pinned model prompt bindings as user-owned overrides.
- Never interpolate `videoDesc` into XML attributes after Task 5.
- Do not hand-edit `data/serve/app.js`; regenerate it with `yarn build` after source verification.
- Run the provider-literal A/B test only after explicit approval of the provider, credentials, and spend cap; final merge/release of the zero-Chinese guarantee is blocked until one syntax is verified.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/videoDesc/schema.ts` | V2 schemas, types, ASCII enum vocabulary. |
| `src/lib/videoDesc/legacy.ts` | Only active decoder containing legacy Chinese markers. |
| `src/lib/videoDesc/index.ts` | Deterministic serializer and v2-or-legacy parser. |
| `src/lib/videoPrompt/input.ts` | Typed JSON request envelope shared by both routes. |
| `src/lib/videoPrompt/providerTokens.ts` | Exact request-cardinality token builder per reference-capable model family. |
| `src/agents/productionAgent/tools.ts` | Accept v2 objects and serialize at the socket boundary. |
| `data/skills/production_execution_storyboard_panel.{md,en.md,vi.md}` | Tell agents to emit named v2 fields. |
| `data/modelPrompt/video/*.{md,en.md,vi.md}` | Consume v2 JSON instead of parsing marker prose. |
| `src/services/videoPromptGeneration.ts` | Shared prompt resolution and request preparation. |
| `src/lib/migrations/promptSeedSync.ts` | Recognize the old English seed as untouched legacy. |
| `docs/i18n/prompt-terms.json` | Fixed translation terms and legacy-decode-only tokens only. |
| `docs/i18n/provider-protocol.json` | Provider/version/date/evidence for the one active reference syntax. |

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
export type VideoDescParseErrorCode = "INVALID_JSON" | "INVALID_V2" | "UNSUPPORTED_LEGACY_FORMAT" | "LEGACY_FIELD_COUNT" | "LEGACY_INVALID_DURATION" | "LEGACY_INVALID_SHOT_NUMBER" | "DURATION_MISMATCH" | "DUPLICATE_SOURCE_ROW" | "NON_MONOTONIC_SOURCE_ROW" | "SINGLE_SHOT_CARDINALITY" | "STORYBOARD_ASSISTED_CARDINALITY" | "TEXT_MODE_FORBIDS_STORYBOARD_REFERENCE" | "SINGLE_SHOT_FORBIDS_STORYBOARD_REFERENCE";
export type VideoDescParseResult =
  | { ok: true; value: VideoDescV2; source: "v2" | "legacy" }
  | { ok: false; error: { code: VideoDescParseErrorCode; message: string } };
export function serializeVideoDesc(value: VideoDescV2): string;
export function parseStoredVideoDesc(raw: string): VideoDescParseResult;
export function decodeLegacyVideoDesc(raw: string): VideoDescParseResult;
```

- [ ] **Step 1: Write failing tests**

Use this canonical fixture:

```ts
const value: VideoDescV2 = {
  schema: "toonflow.video-desc/v2",
  unit: "text-multi-reference-group",
  groupDurationSeconds: 3,
  carryOver: { priorEndState: "A remains beside the desk, facing right." },
  shots: [{
    sourceRow: 1,
    description: "A crouches and turns the safe dial.",
    scene: "study",
    assetNames: ["A", "safe"],
    assetIds: [101, 102],
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

expect(parseStoredVideoDesc(serializeVideoDesc(value))).toEqual({ ok: true, source: "v2", value });
```

Add these named cases with exact expectations:

```ts
const expectCode = (raw: string, code: string) => expect(parseStoredVideoDesc(raw)).toMatchObject({ ok: false, error: { code } });
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
  expect(parseStoredVideoDesc(serializeVideoDesc(mixed))).toEqual({ ok: true, source: "v2", value: mixed });
});
it("returns LEGACY_FIELD_COUNT when a row has five fields", () => expectCode("该组分镜行原文：序号1 | desc | 3 | 中景 | 固定 |", "LEGACY_FIELD_COUNT"));
it("returns LEGACY_INVALID_DURATION for nonnumeric duration", () => expectCode("该组分镜行原文：序号1 | desc | many | 中景 | 固定 | |", "LEGACY_INVALID_DURATION"));
it("returns DUPLICATE_SOURCE_ROW for repeated rows", () => expectCode(legacyWithRows([1, 1]), "DUPLICATE_SOURCE_ROW"));
it("returns NON_MONOTONIC_SOURCE_ROW for decreasing rows", () => expectCode(legacyWithRows([2, 1]), "NON_MONOTONIC_SOURCE_ROW"));
it("returns DURATION_MISMATCH for duration mismatch", () => expectCode(JSON.stringify({ ...value, groupDurationSeconds: 99 }), "DURATION_MISMATCH"));
it("returns UNSUPPORTED_LEGACY_FORMAT for an unknown alias", () => expectCode("该组分镜行原文：序号1 | desc | 3 | 未知景别 | 固定 | |", "UNSUPPORTED_LEGACY_FORMAT"));
it("returns INVALID_V2 for an empty description", () => expectCode(JSON.stringify({ ...value, shots: [{ ...value.shots[0], description: "" }] }), "INVALID_V2"));
it("returns INVALID_V2 for an unexpected top-level key", () => expectCode(JSON.stringify({ ...value, surprise: true }), "INVALID_V2"));
it("accepts fractional durations within epsilon", () => {
  const fractional = { ...value, groupDurationSeconds: 0.3, shots: [{ ...value.shots[0], sourceRow: 1, durationSeconds: 0.1 }, { ...value.shots[0], sourceRow: 2, durationSeconds: 0.2 }] };
  expect(parseStoredVideoDesc(serializeVideoDesc(fractional))).toEqual({ ok: true, source: "v2", value: fractional });
});
it("serializes property-order permutations byte-identically", () => expect(serializeVideoDesc(reorderedValue)).toBe(serializeVideoDesc(value)));
```

Test every legacy alias listed in Step 4, not only a sample.

- [ ] **Step 2: Run and confirm failure**

```bash
yarn vitest run src/lib/videoDesc/videoDesc.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement strict schemas**

```ts
export const videoDescShotSchema = z.object({
  sourceRow: z.number().int().positive(),
  description: z.string().min(1),
  scene: z.string().optional(),
  assetNames: z.array(z.string()),
  assetIds: z.array(z.number().int()),
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

`serializeVideoDesc()` validates semantic invariants, then constructs a new object in the fixed
property order defined in the spec (including each shot and dialogue) before `JSON.stringify()`.
Make the dialogue, carry-over, storyboard-reference, shot, and top-level objects `.strict()`. Require
`Math.abs(groupDurationSeconds - sum(shots[].durationSeconds)) <= 1e-9` and unique, strictly increasing
`sourceRow` values. Map custom Zod issues named `DURATION_MISMATCH`, `DUPLICATE_SOURCE_ROW`,
`NON_MONOTONIC_SOURCE_ROW`, `SINGLE_SHOT_CARDINALITY`, `STORYBOARD_ASSISTED_CARDINALITY`,
`TEXT_MODE_FORBIDS_STORYBOARD_REFERENCE`, or `SINGLE_SHOT_FORBIDS_STORYBOARD_REFERENCE` to the
same public code; map every other Zod issue to `INVALID_V2`.

- [ ] **Step 4: Implement one quarantined legacy decoder**

```ts
const CARRY_PREFIX = "承接上镜：";
const GROUP_MARKER = "该组分镜行原文：";
const ROW = /^序号(\d+)$/;
const SOUND_PREFIX = "音效：";
```

Split on literal `|`, trim structural cells, consume optional carry-over, require each row marker plus exactly six fields, normalize aliases through closed maps, strip only a leading sound prefix, and sum durations. The closed maps include `大远景/大全景`, `远景`, `全景`, `中景`, `中近景/近景`, `特写`, `大特写`, `推/推进/缓推`, `拉/拉远/缓拉`, `摇/摇镜`, `移`, `俯拍`, `仰拍`, `固定/静止`, `跟踪/跟拍`, `甩镜`, `升降`, `环绕`, `手持微晃`, and `一镜到底`. Return typed errors; do not guess or invoke a model.

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
- Modify: `src/i18n/locales/{en,vi,zh}.json`
- Modify: `data/skills/production_execution_storyboard_panel.{md,en.md,vi.md}`

**Interfaces:** `add_flowData_storyboard` accepts `VideoDescV2 | string`; object input is serialized before socket emission.

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
const storyboardVideoDescInputSchema = z.union([videoDescV2Schema, z.string()]);
const serializedVideoDesc = typeof raw.videoDesc === "string" ? raw.videoDesc : serializeVideoDesc(raw.videoDesc);
```

Use `serializedVideoDesc` in the socket payload. Update all locale descriptions to name the v2 schema and forbid positional pipe text for new writes.

- [ ] **Step 3: Rewrite all three producer skills**

Specify each mode explicitly:

- `text-multi-reference-group`: one persisted v2 object per storyboard group; `shots[]` contains every row in that group; no `storyboardReference`.
- `single-shot`: one persisted v2 object per storyboard row; `shots[]` contains exactly one row and no `storyboardReference`.
- `storyboard-assisted`: one persisted v2 object per storyboard row; `shots[]` contains exactly one row and `storyboardReference: { source: "current-item" }`. The tool cannot name a database id before it creates the row.

Preserve table order and place same-scene continuity in `carryOver.priorEndState`. English prose/examples contain no Chinese markers or Chinese example data. Add one valid tool-call example for each unit and schema-validation tests for invalid cardinality.

```ts
const textGroup = { ...base, unit: "text-multi-reference-group", shots: [row1, row2] };
const singleShot = { ...base, unit: "single-shot", groupDurationSeconds: row1.durationSeconds, shots: [row1] };
const storyboardAssisted = { ...base, unit: "storyboard-assisted", groupDurationSeconds: row1.durationSeconds, storyboardReference: { source: "current-item" }, shots: [row1] };
```

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/agents/productionAgent/tools.test.ts
yarn lint
git add src/agents/productionAgent/tools.ts src/agents/productionAgent/tools.test.ts src/i18n/locales data/skills/production_execution_storyboard_panel.md data/skills/production_execution_storyboard_panel.en.md data/skills/production_execution_storyboard_panel.vi.md
git commit -m "feat(video): emit videoDesc v2 from production agent"
```

---

### Task 3: Build one canonical JSON request envelope

**Files:**

- Create: `src/lib/videoPrompt/input.ts`
- Create: `src/lib/videoPrompt/input.test.ts`

**Interfaces:**

```ts
export interface VideoPromptInputV2 {
  contract: "toonflow.video-prompt-input/v2";
  model: { name: string; mode: string };
  assets: Array<{ id: number; type: "role" | "scene" | "prop" | "audio"; name: string; audioAssetId?: number }>;
  storyboardGroups: Array<{
    storyboardId: number;
    duration: number | null;
    videoDesc: VideoDescV2;
    resolvedStoryboardReference?: { storyboardId: number };
  }>;
}

export type VideoPromptInputErrorCode = VideoDescParseErrorCode | "MISSING_OUTER_DURATION" | "OUTER_DURATION_MISMATCH";
export type BuildVideoPromptInputResult =
  | { ok: true; value: VideoPromptInputV2; json: string }
  | { ok: false; code: VideoPromptInputErrorCode; message: string; storyboardIndex?: number };

export function buildVideoPromptInput(args: {
  modelName: string;
  mode: string;
  assets: Array<{ id: number; type: "role" | "scene" | "prop" | "tool" | "audio"; name: string; audioAssetId?: number }>;
  storyboards: Array<{ id: number; videoDesc: string; duration: string | number | null }>;
}): BuildVideoPromptInputResult;
```

- [ ] **Step 1: Write failing tests**

Use this exact pair:

```ts
const legacy = "该组分镜行原文：序号1 | A opens the safe. | 3 | 中景 | 固定 | | 音效：dial clicks";
const equivalentV2 = serializeVideoDesc({ ...value, carryOver: undefined });
const baseArgs = {
  modelName: "seedance-2.0",
  mode: "text-multi-reference-group",
  assets: [{ id: 102, type: "tool", name: "safe" }],
  storyboards: [{ id: 7001, duration: 3, videoDesc: legacy }],
};

it("builds byte-identical envelopes for equivalent legacy and v2 rows", () => {
  const oldResult = buildVideoPromptInput(baseArgs);
  const v2Result = buildVideoPromptInput({ ...baseArgs, storyboards: [{ id: 7001, duration: 3, videoDesc: equivalentV2 }] });
  expect(oldResult).toEqual(v2Result);
});
it("preserves storyboard order and special characters", () => {
  const first = serializeVideoDesc({ ...value, groupDurationSeconds: 3, carryOver: undefined, shots: [{ ...value.shots[0], description: "A says 'open | now <quietly>'" }] });
  const second = serializeVideoDesc({ ...value, groupDurationSeconds: 3, carryOver: undefined, shots: [{ ...value.shots[0], description: "B waits" }] });
  const result = assertOk(buildVideoPromptInput({ ...baseArgs, storyboards: [{ id: 7001, duration: 3, videoDesc: first }, { id: 7002, duration: 3, videoDesc: second }] }));
  expect(JSON.parse(result.json).storyboardGroups.map((group: any) => [group.storyboardId, group.videoDesc.shots[0].description])).toEqual([[7001, "A says 'open | now <quietly>'"], [7002, "B waits"]]);
});
it("returns the parser code with storyboardIndex", () => expect(buildVideoPromptInput({ ...baseArgs, storyboards: [{ id: 42, duration: 3, videoDesc: "bad" }] })).toMatchObject({ ok: false, storyboardIndex: 0 }));
it("returns MISSING_OUTER_DURATION for a text group with null duration", () => expect(buildVideoPromptInput({ ...baseArgs, storyboards: [{ id: 42, duration: null, videoDesc: equivalentV2 }] })).toMatchObject({ ok: false, code: "MISSING_OUTER_DURATION" }));
it("returns OUTER_DURATION_MISMATCH for a text group duration mismatch", () => expect(buildVideoPromptInput({ ...baseArgs, storyboards: [{ id: 42, duration: 4, videoDesc: equivalentV2 }] })).toMatchObject({ ok: false, code: "OUTER_DURATION_MISMATCH" }));
it("normalizes tool assets to prop", () => expect(JSON.parse(assertOk(buildVideoPromptInput(baseArgs)).json).assets[0].type).toBe("prop"));
it("emits no XML or legacy marker prose", () => expect(assertOk(buildVideoPromptInput(baseArgs)).json).not.toMatch(/<storyboardItem|该组分镜行原文|序号1/));
```

- [ ] **Step 2: Implement parse-before-serialize behavior**

Loop through storyboards, call `parseStoredVideoDesc()`, and retain each outer `id`. For text groups,
return `MISSING_OUTER_DURATION` when outer `duration` is null/non-numeric and
`OUTER_DURATION_MISMATCH` when it differs from `groupDurationSeconds`; do not compare outer duration
for the other units. Resolve storyboard-assisted `{ source: "current-item" }` to the outer id only
in `resolvedStoryboardReference`. Return the first row-indexed error, normalize `tool -> prop`,
otherwise build the typed envelope and return `JSON.stringify(value)` as the only user-message
serialization. Seedance template rendering converts canonical `prop` to provider vocabulary `tool`;
other templates receive `prop`.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/lib/videoPrompt/input.test.ts
git add src/lib/videoPrompt
git commit -m "feat(video): build canonical video prompt envelope"
```

---

### Task 4: Rewrite all shipped video templates around v2

**Files:**

- Modify: `data/modelPrompt/video/seedance2Multi-parameterMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/universalMulti-parameterMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/universalFirstAndLastFrameMode.{md,en.md,vi.md}`
- Modify: `data/modelPrompt/video/wan2.6Single-imageFirstFrameMode.{md,en.md,vi.md}`
- Modify: `src/lib/prompts/videoPromptGeneration.ts`
- Modify: `src/lib/prompts/index.test.ts`
- Create: `src/lib/videoPrompt/providerTokens.ts`
- Create: `src/lib/videoPrompt/providerTokens.test.ts`
- Create: `docs/i18n/provider-protocol.json`
- Create: `scripts/i18n-check-provider-protocol.ts`
- Create: `scripts/i18n-check-provider-protocol.test.ts`
- Modify: `package.json`

**Interfaces:** All templates consume `toonflow.video-prompt-input/v2`. Seedance emits one prompt containing subject definitions, ordered shots, and style/constraints.

- [ ] **Step 1: Add failing purity tests**

```ts
const seedanceEn = path.join(videoPromptDir, "seedance2Multi-parameterMode.en.md");
const seedanceVi = path.join(videoPromptDir, "seedance2Multi-parameterMode.vi.md");
const universalEn = path.join(videoPromptDir, "universalMulti-parameterMode.en.md");
const universalVi = path.join(videoPromptDir, "universalMulti-parameterMode.vi.md");

expect(stripStaticProviderTokens(readFileSync(seedanceEn, "utf8"), "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(seedanceVi, "utf8"), "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(universalEn, "utf8"), "universal-multi-reference", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(readFileSync(universalVi, "utf8"), "universal-multi-reference", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(videoPromptGeneration.en, "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
expect(stripStaticProviderTokens(videoPromptGeneration.vi, "seedance2-text-multi", verifiedFixture)).not.toMatch(/[\u3400-\u9fff]/);
```

`stripStaticProviderTokens()` escapes the evidence-backed `staticPlaceholderTokens` and replaces only
their single `N` slot with `(?:N|\d+)`; it never strips a bare prefix. At runtime,
`buildProviderTokens(family, assets, verifiedProtocol)` returns the exact tokens for the actual
request cardinality and type order (for example, `@图片1`, `@图片2`, `<主体1>`, and `<场景1>`).
Test that a one-asset allowlist rejects `@图片2`; never exempt fragments such as `@图片` or `<主体`.

Expected now: fail against 823 Han in the Seedance file and 1,133 Han in the fallback seed.

- [ ] **Step 2: Replace parsing prose with the v2 contract**

The English template must state:

```md
The user message is one JSON object whose contract is toonflow.video-prompt-input/v2.
Every storyboard group contains a structured videoDesc.shots array. Do not split text on punctuation,
pipes, markers, or row labels.

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
`@图片N`) only to entries in the envelope's `assets` array. Do not allocate or mention
storyboard-image references, do not derive reference numbers from `storyboardGroups`, and do not use
legacy `prompt`, `src`, or `shouldGenerateImage` fields as visual material.

Flatten all groups in array order and each group's shots in `sourceRow` order. Assign one global
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

- [ ] **Step 4: Verify and record the provider protocol before release**

Local implementation may proceed with candidate fixtures, but the final provider-protocol gate and
release remain blocked until the user approves provider access, credentials, and a spend cap. The
evidence file has this exact shape:

```ts
interface ProviderProtocolEvidence {
  schema: "toonflow.provider-protocol/v1";
  families: Record<"seedance2-text-multi" | "universal-multi-reference", {
    provider: string;
    model: string;
    modelVersion: string;
    verifiedAt: string;
    status: "verified";
    selectedSyntax: "han" | "english";
    staticPlaceholderTokens: string[];
    testCaseId: string;
    assetCount: number;
    observedBindings: Array<{ token: string; assetId: number; bound: boolean }>;
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
A. Record provider, model/version, test date, seed/assets, observed bindings, selected syntax, and
`status: "verified"` in `docs/i18n/provider-protocol.json`. The typed runtime builder reads the
selected verified syntax; it does not read `prompt-terms.json`. The checker validates schema, both
reference-capable families, model/version identity, every `bound: true`, complete placeholder forms,
and the absence of unverified candidate status; it fails for missing or stale evidence.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/lib/prompts/index.test.ts src/lib/videoPrompt/providerTokens.test.ts scripts/i18n-check-provider-protocol.test.ts
yarn i18n:check-provider-protocol
git add data/modelPrompt/video src/lib/prompts/videoPromptGeneration.ts src/lib/prompts/index.test.ts src/lib/videoPrompt/providerTokens.ts src/lib/videoPrompt/providerTokens.test.ts docs/i18n/provider-protocol.json scripts/i18n-check-provider-protocol.ts scripts/i18n-check-provider-protocol.test.ts package.json
git commit -m "feat(video): consume structured video prompt input"
```

---

### Task 5: Share one generation service between single and batch routes

**Files:**

- Create: `src/services/videoPromptGeneration.ts`
- Create: `src/services/videoPromptGeneration.test.ts`
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
  | { ok: true; request: { system: string; assistant: string; user: string } }
  | { ok: false; code: VideoPromptInputErrorCode | "STORYBOARD_NOT_FOUND" | "PROMPT_TEMPLATE_NOT_FOUND"; storyboardIndex?: number; detail: string }
>;
```

- [ ] **Step 1: Extend route tests to capture all messages**

Insert one legacy and one v2 storyboard. Assert `JSON.parse(user).contract` is v2, every group appears once in order, and neither route emits XML, `join("，")`, or legacy marker prose.

- [ ] **Step 2: Extract shared preparation**

Move duplicate asset/storyboard queries, audio binding, canonical/pinned prompt resolution, automatic mode selection, strict localized art-manual lookup, and envelope construction into the service. The service returns typed, nonlocalized errors. Routes retain validation, state transitions, HTTP responses, per-track orchestration, and translate the operational error with `content_language` catalog keys before responding. Parser failures stop before `Ai.Text().invoke()` with row index and code.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts
yarn lint
git add src/services/videoPromptGeneration.ts src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.ts src/routes/production/workbench/batchGeneratePrompt.test.ts
git commit -m "refactor(video): centralize prompt request preparation"
```

---

### Task 6: Preserve old seeds and quarantine legacy terms

**Files:**

- Create: `src/lib/prompts/legacy/videoPromptGenerationEnV1.ts`
- Modify: `src/lib/migrations/promptSeedSync.ts`
- Modify: `src/lib/migrations/promptSeedSync.test.ts`
- Modify: `docs/i18n/prompt-terms.json`
- Modify: `scripts/i18n-check-terms.ts`
- Modify: `scripts/i18n-check-terms.test.ts`

- [ ] **Step 1: Extract the current English seed byte-identically**

Before rewriting it, move the current `videoPromptGeneration.en` value into `LEGACY_VIDEO_PROMPT_GENERATION_EN_V1`. Verify the mechanical extraction with:

```ts
expect(LEGACY_VIDEO_PROMPT_GENERATION_EN_V1.length).toBe(37851);
expect(sha256(LEGACY_VIDEO_PROMPT_GENERATION_EN_V1)).toBe("9fc6b347e12977d89cf3798fae89b2182b9f636584e9d913021391633ca7fa6a");
```

Add it to guarded legacy variants. Test that an untouched old English row updates, while a one-character edit and non-null `useData` remain unchanged.

- [ ] **Step 2: Reclassify registry terms**

Mark carry-over, group-row, row-number, inline carry-over, and sound-prefix markers as
`legacy-decode-only`; remove their English prompt occurrence requirements. Keep
`prompt-terms.json` limited to fixed glossary/legacy policy. Provider evidence lives in
`provider-protocol.json`, while request-specific full tokens come only from
`buildProviderTokens()`.

- [ ] **Step 3: Tighten checker behavior**

The checker fails if an English or Vietnamese video template contains Han after bounded complete
static provider-token shapes are stripped. Payload tests strip only the exact runtime token list
generated for that request. Legacy markers may occur only in `legacy.ts`, registry history, Chinese
locale files, and compatibility fixtures. The provider-protocol checker fails unless the selected
syntax has current verified evidence.

```ts
expect(findUnexpectedHan("Use @图片1 only.", ["@图片1"])).toBeNull();
expect(findUnexpectedHan("Use 承接上镜 as a prefix.", ["@图片1"])).toBe("承");
```

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/lib/migrations/promptSeedSync.test.ts scripts/i18n-check-terms.test.ts scripts/i18n-check-provider-protocol.test.ts
yarn i18n:check-terms
yarn i18n:check-provider-protocol
git add src/lib/prompts/legacy/videoPromptGenerationEnV1.ts src/lib/migrations/promptSeedSync.ts src/lib/migrations/promptSeedSync.test.ts docs/i18n/prompt-terms.json scripts/i18n-check-terms.ts scripts/i18n-check-terms.test.ts
git commit -m "test(video): quarantine legacy prompt protocol"
```

---

### Task 7: Verify compatibility and generated output

**Files:** Verify Tasks 1–6; change only those files when a test reveals a defect.

- [ ] **Step 1: Run focused and repository suites**

```bash
yarn vitest run src/lib/videoDesc/videoDesc.test.ts src/lib/videoPrompt/input.test.ts src/lib/videoPrompt/providerTokens.test.ts src/agents/productionAgent/tools.test.ts src/services/videoPromptGeneration.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts src/lib/prompts/index.test.ts src/lib/migrations/promptSeedSync.test.ts scripts/i18n-check-terms.test.ts scripts/i18n-check-provider-protocol.test.ts
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

1. Ship Task 1 first; it adds read compatibility only.
2. After Task 1 is available, ship Tasks 2–6 atomically in one compatibility release. The producer,
   canonical envelope, templates, shared service/routes, fallback seed, and term policy must not be
   enabled independently.
3. Within that release, deploy normalization before route traffic and keep legacy strings readable
   until every producer and prompt consumer is live.
4. Leave historical rows untouched; malformed legacy values fail before model invocation with row index and parser code.
5. Label `useData` and locale-pinned prompt files as user overrides; do not rewrite them in this migration.
