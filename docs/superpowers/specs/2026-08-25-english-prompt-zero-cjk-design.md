# Design: English Prompt Purity and i18n Completion

Date: 2026-08-25
Status: proposed
Repository: `kienmatu/Toonflow-app`
Baseline: `master` at `8c8c2e9`
QA source: `.gstack/qa-reports/qa-report-localhost-2026-08-25.md`

## 1. Decision

When `prompt_language=en`, all application-authored model instructions, labels, examples,
tool descriptions, schema descriptions, prompt wrappers, connective language, style prose,
and constraints must be English.

This is a **zero-Chinese-prose** guarantee, not automatically a zero-Han-codepoint guarantee.
Two classes may remain non-English:

1. **Verbatim runtime data** supplied by a user or an upstream story record: names, dialogue,
   descriptions, sound effects, and legacy carry-over text. The application must not silently
   translate or reject that creative content.
2. **Verified provider protocol literals** that a video provider requires character-for-character.
   Candidate Seedance syntax is `@图片N`, `<主体N>`, `<场景N>`, and `<道具N>`.
   Those are the complete placeholder forms used in shipped templates; runtime checks enumerate
   complete rendered tokens such as `@图片1` and `<主体1>` and never exempt broad fragments.
   Stage 0 tests English aliases; if Seedance binds references reliably with `@imageN`,
   `<subjectN>`, `<sceneN>`, and `<propN>`, the allowlist is removed and English mode becomes
   a literal zero-Han prompt. Candidate syntax is not a release exception: the zero-Chinese
   guarantee cannot ship until provider/model/version evidence marks one syntax verified.
   The current universal multi-reference `@图N` form is governed by the same rule and must either be
   verified for its model family or replaced with a verified English alias. First/last-frame and Wan
   modes use no in-prompt reference token and need no exception.

Chinese style tags are prose, not protocol. For example,
`中世纪史诗实拍风格，电影感，自然光与火光照明，低饱和度调色，极致细节`
must exist only in the Chinese prompt/manual variant. The English variant uses an English style
description.

`content_language` continues to control person-facing UI/API text. `prompt_language` controls
model-facing text. Changing one must not silently change the other.

## 2. Why translation-only is insufficient

The current Seedance path is a model-parsed Chinese string protocol:

```text
production_execution_storyboard_panel.<locale>.md
  -> add_flowData_storyboard(videoDesc: string)
  -> o_storyboard.videoDesc TEXT
  -> generateVideoPrompt / batchGeneratePrompt
  -> XML-like interpolation of raw videoDesc
  -> Seedance system prompt asks the LLM to parse:
       承接上镜： / 该组分镜行原文： / 序号N / six pipe-delimited fields
```

The shipped English Seedance prompt contains 823 Han characters. Translating its surrounding
sentences would leave the cross-layer protocol fragile: an emitter and a consumer must still spell
Chinese markers identically, pipes inside content are ambiguous, extra storyboard columns are
silently fused into one description cell, and malformed input is delegated to an LLM to guess.

The route also interpolates unescaped values into XML attributes and duplicates the prompt-building
logic between single and batch generation.

## 3. Approaches considered

### A. Translate prompt files only

Translate the English Markdown and inline route strings but keep the Chinese `videoDesc` grammar.

- Advantage: smallest diff.
- Cost: English prompts still contain Chinese parser literals and examples; the model remains the
  parser; malformed pipes/quotes remain unsafe; emitter/consumer drift remains possible.
- Decision: rejected as a partial fix.

### B. Canonical `videoDesc` v2 plus a legacy decoder

Store a self-describing JSON document in the existing `o_storyboard.videoDesc TEXT` column. New
agent writes use a typed object. Existing strings are decoded deterministically before prompt
assembly. The LLM receives a JSON request envelope, not raw marker text.

- Advantage: removes Chinese structural markers from new data and prompts, preserves old projects,
  centralizes parsing, and makes the one-group/many-shot behavior testable.
- Cost: coordinated changes across the producer skill, agent tool, routes, prompt templates,
  registry, and tests.
- Decision: **recommended**.

### C. Build the final video prompt entirely in TypeScript

Use deterministic templates and skip the prompt-generation LLM.

- Advantage: strongest format guarantee and cheapest runtime.
- Cost: loses semantic compression, natural continuity writing, voice inference, and provider-specific
  narrative quality currently supplied by the LLM.
- Decision: defer. The v2 contract keeps this possible later.

## 4. Locale-neutral video description contract

Create a focused module under `src/lib/videoDesc/`.

```ts
export const shotSizeSchema = z.enum([
  "extreme-wide",
  "long-shot",
  "wide",
  "medium",
  "medium-close",
  "close-up",
  "extreme-close-up",
]);

export const cameraMovementSchema = z.enum([
  "static",
  "push-in",
  "pull-back",
  "pan",
  "truck",
  "tracking",
  "follow",
  "whip-pan",
  "crane",
  "orbit",
  "high-angle",
  "low-angle",
  "handheld",
  "one-take",
]);

const assetReferenceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
}).strict();

const dialogueSchema = z.object({
  kind: z.enum(["spoken", "inner-monologue", "voiceover", "none"]),
  text: z.string(),
  speakerAssetId: z.number().int().positive().optional(),
}).strict();

const detailedShotSchema = z.object({
  sourceRow: z.number().int().positive(),
  description: z.string().min(1),
  scene: z.string().optional(),
  assetReferences: z.array(assetReferenceSchema),
  durationSeconds: z.number().positive(),
  shotSize: shotSizeSchema,
  cameraMovement: cameraMovementSchema,
  action: z.string().optional(),
  orientation: z.string().optional(),
  spatialRelation: z.string().optional(),
  emotion: z.string().optional(),
  dialogue: dialogueSchema,
  soundEffects: z.array(z.string()),
}).strict();

export const videoDescV2Schema = z.discriminatedUnion("unit", [
  z.object({
    schema: z.literal("toonflow.video-desc/v2"),
    unit: z.literal("text-multi-reference-group"),
    groupDurationSeconds: z.number().positive(),
    carryOver: z.object({ priorEndState: z.string().min(1) }).strict().optional(),
    shots: z.array(detailedShotSchema).min(1),
  }).strict(),
  z.object({
    schema: z.literal("toonflow.video-desc/v2"),
    unit: z.literal("single-shot"),
    shot: detailedShotSchema,
  }).strict(),
  z.object({
    schema: z.literal("toonflow.video-desc/v2"),
    unit: z.literal("storyboard-assisted"),
    storyboardReference: z.object({ source: z.literal("current-item") }).strict(),
    guidance: z.string().optional(),
  }).strict(),
]);

export const legacyOpaqueSingleShotSchema = z.object({
  unit: z.literal("legacy-opaque-single-shot"),
  raw: z.string().min(1),
  readOnly: z.literal(true),
}).strict();
```

`description`, names, dialogue, sound effects, and carry-over values are data and may use any
language. Field names, enum values, and structural metadata are ASCII.

Public interfaces:

```ts
export type VideoDescV2 = z.infer<typeof videoDescV2Schema>;
export type VideoDescParseErrorCode =
  | "INVALID_JSON"
  | "INVALID_V2"
  | "UNSUPPORTED_LEGACY_FORMAT"
  | "LEGACY_FIELD_COUNT"
  | "LEGACY_INVALID_DURATION"
  | "LEGACY_INVALID_SHOT_NUMBER"
  | "REFERENCE_DUPLICATE_ID"
  | "REFERENCE_UNKNOWN_ASSET"
  | "REFERENCE_NAME_MISMATCH"
  | "REFERENCE_NOT_ASSOCIATED"
  | "REFERENCE_WRONG_PROJECT"
  | "DIALOGUE_SPEAKER_NOT_REFERENCED"
  | "DURATION_MISMATCH"
  | "DUPLICATE_SOURCE_ROW"
  | "NON_MONOTONIC_SOURCE_ROW";
export interface VideoDescParseError { code: VideoDescParseErrorCode; message: string; }
export type VideoDescParseResult =
  | { ok: true; value: VideoDescV2; source: "v2" }
  | { ok: true; value: VideoDescV2 | z.infer<typeof legacyOpaqueSingleShotSchema>; source: "legacy"; legacyGrammar: LegacyGrammar }
  | { ok: false; error: VideoDescParseError };

export function serializeVideoDesc(value: VideoDescV2): string;
export function parseStoredVideoDesc(raw: string, context: LegacyDecodeContext): VideoDescParseResult;
export function decodeLegacyVideoDesc(raw: string, context: LegacyDecodeContext): VideoDescParseResult;
```

The serializer constructs a canonical object with a fixed top-level, shot, and dialogue property
order before calling `JSON.stringify`; equivalent objects with different insertion orders therefore
produce byte-identical compact JSON. No database schema change is required. The legacy decoder is
the only runtime module allowed to contain `承接上镜：`,
`该组分镜行原文：`, `序号`, and `音效：`.

Parsing is provenance/context-aware. `LegacyDecodeContext` includes route/source, generation `mode`,
outer duration, `shouldGenerateImage`, prompt/image availability, associated asset IDs, and project
id. Explicit decoders cover captured marker/pipe `序号N` groups, numeric Markdown table rows with
leading/trailing pipes, 12-field ideographic-comma single shots, first/last free-form text, and the
storyboard-assisted fixed text `参考故事板内容进行视频生成`. Arbitrary strings accepted by
`editStoryboardInfo.ts` become read-only `legacy-opaque-single-shot`; they are never guessed into
detailed fields or emitted as V2 by the agent. The decoder task proves real captured fixtures only;
route-level read compatibility is claimed later, when the shared single/batch adapters replay every
family in the atomic integration release.

The decoder normalizes Chinese, English, and Vietnamese aliases only when a known grammar supplies
that field. It returns typed errors for invalid duration, missing cells, duplicate/non-monotonic shot
numbers, empty descriptions, unsupported closed vocabulary, and reference-integrity failures. It
never asks the LLM to repair malformed structure and never invents absent fields.

The alias table must preserve distinctions present in source data: `大远景/大全景 -> extreme-wide`,
`远景 -> long-shot`, `全景 -> wide`, `中景 -> medium`, `中近景/近景 -> medium-close`,
`特写 -> close-up`, and `大特写 -> extreme-close-up`. Camera aliases cover `推/推进/缓推`,
`拉/拉远/缓拉`, `摇/摇镜`, `移`, `俯拍`, `仰拍`, `固定/静止`, `跟踪/跟拍`, `甩镜`,
`升降`, `环绕`, `手持微晃`, and `一镜到底` without collapsing an unsupported value silently.

Map a Zod custom issue whose message is one of the public semantic codes to that exact code; map
all other schema issues to `INVALID_V2`. All schemas are strict. `assetReferences` replaces parallel
arrays: IDs are positive and unique, names exactly match current-project database rows, references
are a subset of `associateAssetsIds`, and each dialogue speaker is a referenced role. The agent can declare only
`storyboardReference: { source: "current-item" }` because the database id does not exist until the
tool persists the row. Prompt preparation resolves that discriminant against the outer storyboard
record; non-storyboard units forbid the field.

## 5. Prompt input envelope

Create `src/lib/videoPrompt/input.ts`:

Prompt selection is row-aware before it considers a model binding. Parsing classifies each stored
row as `video-prompt-input/v2` or `legacy-v1`: native V2 and losslessly recoverable detailed legacy
grammars are V2-capable; historical first/last free-form and `legacy-opaque-single-shot` rows require
the new strict exact-locale `legacy-v1-compat` prompt/adapter. An all-legacy request automatically
selects that compat prompt even when the model has a shipped V2 default. The locked old English seed
is recognition/migration data only and is never executable. An all-V2 request may select only a V2 prompt.
A mixed batch fails with localized `MIXED_PROMPT_INPUT_CONTRACTS` and offending row indices before
any provider call; it is never concatenated into either envelope. Explicit bindings are checked only
after row classification, and an incompatible binding fails closed. Single-route and batch tests
cover default and custom bindings for all-legacy, all-V2, and mixed inputs. Thus no legacy row can
reach a V2-only prompt and no V2 row can reach the legacy adapter.

```ts
export interface VideoPromptInputV2 {
  contract: "toonflow.video-prompt-input/v2";
  model: { name: string; mode: string };
  assets: Array<{
    id: number;
    type: "role" | "scene" | "prop" | "clip" | "audio";
    name: string;
    referenceRole: "visual-subject" | "visual-scene" | "visual-prop" | "video-reference" | "audio-reference";
    filePath: string;
    audioAssetId?: number;
  }>;
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
  projectId: number;
  modelName: string;
  mode: string;
  assets: Array<{ id: number; type: "role" | "scene" | "prop" | "tool" | "clip" | "audio"; name: string; filePath: string; audioAssetId?: number }>;
  storyboards: Array<{ id: number; videoDesc: string; duration: string | number | null; shouldGenerateImage: number | string | null; prompt: string | null; filePath: string | null; associateAssetsIds: number[] }>;
}): BuildVideoPromptInputResult;
```

Single and batch routes must share one repository/service function for:

1. loading storyboard/assets;
2. parsing every stored `videoDesc`;
3. selecting the locale/model prompt;
4. building the JSON user message;
5. validating the returned model prompt.

This removes XML attribute injection and accidental comma-joining of `storyboard.map(...)`.
The route normalizes legacy `tool` assets to canonical `prop` and validates file presence plus
project ownership. Visual image assets (`role`, `scene`, `prop`), `clip`/video, and audio all retain
explicit reference roles. Seedance text multi-reference numbers only visual asset images; it never
numbers storyboard images, clips, or audio. Universal modes retain their valid image, video, and
audio reference roles. Mixed-modality and missing-file tests cover each mode.

Each stored storyboard input includes its outer `id` and `duration`. For a text-multi-reference
group, missing/non-numeric duration returns `MISSING_OUTER_DURATION`; a numeric mismatch returns
`OUTER_DURATION_MISMATCH`. Other units do not use the outer group duration for semantic comparison.
For storyboard-assisted input, prompt preparation resolves `{ source: "current-item" }` to the
outer record's id in `resolvedStoryboardReference` after persistence.

## 6. Seedance output contract

The prompt generator receives every `storyboardGroups[].videoDesc` and returns strict structured
Zod/tool output, not the final free-form string:

1. `subjectDefinitions`;
2. ordered shot objects containing global ordinal, group index, source row, semantic text, and
   dialogue;
3. `styleConstraints`.

The service validates exact shot count, global ordering, `(groupIndex, sourceRow)` traceability, and
byte-identical dialogue preservation. Missing, extra, or reordered shots and omitted/changed
dialogue fail before any DB update. A deterministic renderer then produces the one final prompt in
exactly three semantic parts: subject/reference definitions; optional carry-over once plus all
shots; and style/constraints. The LLM remains responsible for semantic compression, while TypeScript
owns structure and final rendering.

`sourceRow` may restart inside each group. The output assigns one global ordinal across the flattened
group/row order (`Shot 1`, `Shot 2`, ...); tests also retain `(groupIndex, sourceRow)` metadata so
every output shot is traceable without duplicate labels.

Seedance text multi-reference uses asset images only. `@图片N` numbering comes exclusively from
the request envelope's `assets` array; no storyboard image is numbered, referenced, or fabricated.

English connective prose and labels use this shape:

```text
Define the person in @图片1 as <主体1> (Sir Aldric); define the hall in @图片2 as <场景1>.

Previous-shot continuity: {verbatim priorEndState, when present}

Shot 1: medium static shot, <主体1> kneels before <场景1> ... No dialogue. <fire crackles>.
Shot 2: close-up push-in, ...

Style and constraints: medieval epic live action; cinematic; natural firelight; desaturated
color grade; high definition; stable faces; continuous movement; no subtitles, text, watermark,
or logo.
```

The application does not output `承接上镜`, `镜头`, `无台词`, `音色`, or Chinese style prose
when `prompt_language=en`. Verbatim Chinese dialogue or names may remain because they are data.

## 7. Prompt-language primitives

The existing general `t()` and `readLocalizedSkill()` deliberately fall back to Chinese. That is
acceptable for viewer-friendly fallback but violates the model-prompt contract.

Add separate strict primitives:

```ts
export function tPrompt(
  key: string,
  vars: Record<string, string | number>,
  locale: Locale,
): string;

export function canonicalPromptPath(filePath: string): string;
export function localeSidecarPath(canonicalPath: string, locale: Locale): string;
export function readPromptFile(
  canonicalPath: string,
  locale: Locale,
  sourceLocale: Locale,
): string;

export function resolvePromptSkillPath(
  canonicalPath: string,
  locale: Locale,
): string;

export function readPromptSkill(
  canonicalPath: string,
  locale: Locale,
): string;
```

Resolution policy:

- Canonical files may be English- or Chinese-origin. `sourceLocale` is explicit, never inferred from
  Han characters or filenames.
- Use the canonical file only when its `sourceLocale` equals the requested locale.
- Otherwise require the exact `.<locale>.md` sidecar; `localeSidecarPath()` supports `en`, `vi`, and
  `zh`, while `canonicalPromptPath()` strips all three suffixes.
- `data/modelPrompt` calls `readPromptFile()` with an explicit source locale. `data/skills` calls
  manifest-aware `readPromptSkill()`.
- A missing required prompt translation throws before model invocation. The API returns a
  `content_language`-localized operational error naming the missing file/key.

The foundation builds one centralized boundary mapper in dependency order: Task 1 adds
`MissingPromptTranslationError`; after Task 2 defines strict file resolution, Task 2B extends it with
`MissingPromptLocaleFileError`. At HTTP, agent/socket, and background-task boundaries, HTTP returns a
typed localized 4xx, tools return a localized failure without scheduling work, and background tasks
persist a terminal localized failure. Both error families are tested on all three paths to stop
before provider invocation and avoid partial writes.

`tPrompt` requires the exact selected locale: `en -> en`, `vi -> vi`, and `zh -> zh`. A missing
entry fails before model invocation rather than silently changing the prompt language.

## 8. Prompt provenance and enforcement

Classify every model request segment:

```ts
type PromptSegmentKind = "instruction" | "protocol" | "verbatim-data";
```

- `instruction`: must contain no unexpected Han in `en`/`vi`.
- `protocol`: may contain only exact values generated from the verified provider protocol and the
  current request's reference cardinality.
- `verbatim-data`: not translated or scanned as application prose.

Tests capture the actual payload passed to `Ai.Text().invoke()`, `Ai.Image().run()`, or video-model
invocation. Fixtures include Han-bearing verbatim names, descriptions, dialogue, carry-over, and
sound effects and assert byte identity plus invocation; neighboring authored Han instructions still
fail. ASCII sentinels remain useful for shell isolation but are not the only data fixtures. Static
checks validate shipped templates and application-authored wrappers. Sampled provider QA evaluates
generated output; this design does not infer provenance or reject mixed-language free-form model
output at runtime.

Fixed translation/legacy policy stays in `docs/i18n/prompt-terms.json`. Provider evidence is stored
separately in `docs/i18n/provider-protocol.json`; a typed runtime builder enumerates complete tokens
for the actual asset cardinality. Static scans recognize only complete numbered/placeholder token
shapes, while payload tests permit only the exact list generated for that request. Old structural
markers are `legacy-decode-only` and may occur only in `src/lib/videoDesc/legacy.ts` and compatibility
fixtures. Stored database enums do not enter prompts.

`i18n-ignore` is not sufficient for model-facing prompt prose.

The callsite audit discovers every `u.Ai.Text`, `u.Ai.Image`, and `u.Ai.Video` invocation through the
TypeScript AST and traces all authored segments that flow into it. Every literal and `t()`/`tPrompt()`
call must be classified; there is no hand-maintained scope list. The inventory includes helpers such
as `src/utils/cleanNovel.ts`, `src/routes/setting/agentDeploy/agentSetKey.ts`, and vendor model-test
routes. UI/log/error text may use ordinary `t()` only under an explicit `prompt-ui-only` annotation
whose non-flow into model arguments is verified. `findUnexpectedHan()` returns `string[]`
everywhere; an empty array means clean.

## 9. Remaining model prompts and medieval skills

The six hardcoded prompt shells in asset generation, prompt polishing, art-style extraction, and
audio binding move to `tPrompt`/dedicated builders. Person-facing errors keep using `getLocale()`.

The 15 Medieval Epic / medieval live-action canonical files are English-origin. Keep those canonical
English files, retain/update their existing `.vi.md` variants, and add `.zh.md` sidecars; do not add
redundant `.en.md` files. Canonical `art_storyboard_video.md` contains English Seedance style prose,
while the Chinese tag remains only in `art_storyboard_video.zh.md`. Manifest coverage expands from
README-only to all canonical skill Markdown files, with explicit `sourceLocale` metadata.

The medieval preset is not the whole corpus. A deterministic inventory resolves every English and
Vietnamese variant under `data/skills` and `data/modelPrompt`; every residual Han run is translated
unless it is a complete token from the verified provider protocol. The existing blanket sidecar
budget cannot satisfy the final gate.

Model-facing readers switch to `readPromptSkill`; UI/manual viewers may retain graceful fallback.

Packaged strict readers require a safe corpus installer first. A versioned shipped-content manifest
hashes every `data/skills` and `data/modelPrompt` file. Fresh install provisions both trees. Upgrade
overwrites or deletes a shipped path only when the destination still matches its previous shipped
hash; modified shipped files and custom files are preserved. Backup/recovery metadata is written
before atomic changes. Tests cover fresh install, untouched upgrade, modified skill, custom prompt,
removed shipped file, retained modified removal, and injected-failure recovery. The installer never
force-deletes the installed `skills` or `modelPrompt` tree.

Prompt bindings declare `languagePolicy: "shipped-strict" | "pinned-locale" | "custom-unscoped"`
and a versioned `promptInputContract`. Only shipped files use strict source maps. Explicit
locale-pinned custom files and unsuffixed custom prompts remain byte-identical user overrides and
never pass through shipped-only source-locale rejection. Backend list/binding/generation tests and
localized web badges/warnings cover all policies.

## 10. Frontend and production workflow ownership

The maintainable fix belongs in Toonflow-web source. Until that source fix is released, this repo
uses a guarded, fail-loud, byte-idempotent bundle patch for each stable compiled anchor.

The release patch covers:

- raw batch-import keys;
- Interface Settings labels;
- video mode labels;
- Markdown editor locale;
- final video editor locale, track names, and snap label;
- prompt-language widget authentication/mount guard;
- Model Mapping stable row keys/type labels;
- measured production-node re-layout after content resize.

Successful save application and reflow `fromObject` calls use the same serialized graph-mutation
queue plus a monotonically increasing generation token. Every async `nextTick` and dimension-
stabilization continuation verifies freshness, and the token is checked immediately before the
queued mutation. No save handler calls `fromObject` outside that queue. Stabilization/mutation
failures are caught and reported without an unhandled rejection. Fake-timer/deferred-promise tests
prove rapid plan/table saves and delayed imports cannot let an older generation overwrite a newer
one; timeout leaves the latest saved graph intact. The queue stores and returns its handled promise,
and timer callbacks attach a terminal nonthrowing catch. Tests reject `fromObject`, observe one
report and no `unhandledrejection`, then prove a subsequent queued mutation still succeeds.

Every bundle sub-patch validates all anchor cardinalities before writing. A second run is byte
identical. Chinese locale output remains unchanged. The build/release process runs the patch suite
in a fixed order; merely changing a patch script without regenerating `data/web/index.html` is a
failed release.

Backend hardening adds a stable Model Mapping `key` and corrects the inverse `findIndex` predicate
in `upVendorModel.ts`. Director cover artwork becomes text-free so one asset works in every locale.

The companion Toonflow-web source PR lands before this repository imports its bundle. A committed
provenance manifest records the exact upstream repository URL, source commit SHA, build command, and
SHA-256 of `dist/index.html`; CI verifies the imported `data/web/index.html` against that source
artifact before packaging.

Merged PR #15 remains a separate, intentional boundary: the batch-import UI chooses its editable
default chapter regex from the interface locale, while `/script/getAiRegex` uses `prompt_language`
only for its model instruction and infers the actual headings in the submitted script. That helper
is invoked by the user-facing importer, not by the script/director/production agents, and it has no
role in decoding `videoDesc`.

## 11. Compatibility and rollout

1. Land prompt/manifest primitives, arbitrary-source-locale sidecar/glossary validators, localized
   failure mapping, and the hash-aware packaged-corpus installer; then complete the medieval
   canonical-English plus Vi/Zh corpus.
2. Ship the v2 parser and legacy decoder alone; it changes no writes or model requests.
3. Release producer writes, route normalization, JSON envelopes, rewritten templates, and guarded
   seed recognition atomically. A producer must never write v2 JSON while the active template still
   expects the old marker/pipe grammar.
4. Before rewriting templates, extract the locked legacy English seed byte-identically from pinned
   base SHA `8c8c2e917ce714b18dd588ba13d6553a99e6a71b` and verify length `37851` plus SHA-256
   `9fc6b347e12977d89cf3798fae89b2182b9f636584e9d913021391633ca7fa6a`. Keep known old
   variants in `promptSeedSync` for recognition/migration only; never expose those bytes as a runtime
   prompt, and never overwrite `useData`, hand-edited seed text, or a pinned/custom model prompt.
5. Adopt strict readers and tighten scanners only after all required sidecars/templates exist.
6. Apply and verify frontend patches, then run the end-to-end QA flow in `en`, `vi`, and `zh`.

No destructive bulk database rewrite is required. Existing rows decode on read. A later background
backfill may rewrite only rows successfully decoded from a known legacy grammar.

Prompt input contracts are versioned and selection starts from the rows, not the prompt binding.
Historical first/last free-form and opaque rows force the new strict exact-locale
`legacy-v1-compat` adapter; native or losslessly normalized detailed rows require
`video-prompt-input/v2`. A mixed batch fails before
invocation with row indices. Existing `o_prompt.useData`, pinned files, and custom prompts default to
`legacy-v1`, but they are selected only as explicit legacy-compatible user overrides and produce a
localized warning that authored-language purity is not guaranteed; they never silently receive the
V2 JSON envelope. V2 rows require a V2-capable prompt or return a localized incompatibility error.
Shipped rewritten templates declare `video-prompt-input/v2`; the new compat prompt has canonical
English plus exact Vietnamese/Chinese variants. Static scans and route captures prove the English/
Vietnamese compat instructions have no authored Han except evidence-backed exact provider tokens,
while opaque raw text remains byte-identical. Migration preview and upgrade tests show each binding's
policy/contract and preserve overrides byte-identically.

Provider evidence comes only from an approval-gated executable harness. Each family owns an array of
entries keyed by the composite family/vendor/model/version/config identity, so multiple configured
models in one family coexist without overwriting or authorizing each other. For every entry it stores
the exact request, input asset hashes, seed,
provider response/output artifacts, evaluator result, and hashes of all artifacts. Runtime token
selection receives the active vendor/model/version/config fingerprint and fails closed unless it
exactly matches evidence. Evidence staleness is deterministic: any identity, config, template, or
token-builder hash mismatch invalidates it. `verifiedAt` is ISO audit metadata, not a wall-clock
expiry. Evidence for one family/configured model never authorizes another; tests include two entries
in one family, exact runtime selection, ambiguity/partial-match rejection, tampering, and every
identity/hash mismatch.

## 12. Acceptance criteria

- `prompt_language=en` sends English application-authored prose for every shipped/default model
  route.
- English/Vietnamese Seedance/default prompt files contain no unexpected Han after stripping only
  complete static token shapes backed by verified provider evidence; payload tests allow only the
  exact tokens generated for that request.
- The old Chinese `videoDesc` markers exist only in the legacy decoder, compatibility fixtures,
  the Chinese locale, and registry history.
- Every captured historical grammar passes route-level replay. Legacy and V2 fixtures derived from
  the same recoverable data have identical canonical recoverable projections; tests separately
  assert documented defaults/loss for fields absent from legacy input.
- Opaque/first-last historical rows use the new exact-locale `legacy-v1-compat` runtime prompt. Its
  en/vi authored text passes the same Han gate; the locked old seed is never selected. An explicit
  custom legacy override is warned and remains outside the shipped-prompt guarantee.
- All sub-shots from one group reach one LLM request; strict structured output preserves count,
  order, traceability, and dialogue before deterministic three-part rendering.
- Dialogue, names, and other verbatim user data remain unchanged.
- Missing English/Vietnamese prompt translations fail before model invocation; there is no silent
  Chinese fallback.
- The six known hardcoded route prompts pass an `en`/`vi`/`zh` payload-capture matrix.
- All Medieval Epic / medieval live-action prompt files have canonical English, exact Vi/Zh variants,
  and complete manifest entries.
- Every resolved English/Vietnamese shipped prompt variant has zero unresolved application-authored
  Han, and the corpus inventory is empty of unresolved hits.
- English UI contains no raw keys or Chinese labels in the tested creation-to-export flow.
- Manual production nodes do not overlap downstream controls after resize.
- Model Mapping expands custom models without console exceptions.
- Model Mapping labels all language policies and prompt-input compatibility; incompatible legacy/V2
  bindings fail locally before provider invocation.
- The imported frontend bundle's SHA-256 is verified against the exact companion source commit.
- Existing Chinese locale behavior remains available.
- `yarn i18n:ci` owns lint, full tests, manifest, sidecars, glossary, terms, provider evidence,
  prompt-callsite audit, corpus inventory, and CJK scan; both debug (`master`) and release workflows
  require it before packaging. Browser QA also passes.

## 13. Out of scope

- Translating user-authored dialogue, names, or story text.
- Translating stored database enum values in place.
- Replacing the video-prompt LLM with a deterministic renderer.
- Overwriting custom prompt overrides or explicit locale-pinned bindings.
- Adding backend locales beyond `en`, `vi`, and `zh`.
