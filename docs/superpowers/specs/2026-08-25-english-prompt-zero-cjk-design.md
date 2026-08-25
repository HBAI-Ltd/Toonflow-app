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

export const dialogueSchema = z.object({
  kind: z.enum(["spoken", "inner-monologue", "voiceover", "none"]),
  text: z.string(),
  speakerAssetId: z.number().int().optional(),
}).strict();

export const videoDescShotSchema = z.object({
  sourceRow: z.number().int().positive(),
  description: z.string().min(1),
  scene: z.string().optional(),
  assetNames: z.array(z.string()),
  assetIds: z.array(z.number().int()),
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

export const videoDescV2Schema = z.object({
  schema: z.literal("toonflow.video-desc/v2"),
  unit: z.enum([
    "text-multi-reference-group",
    "single-shot",
    "storyboard-assisted",
  ]),
  groupDurationSeconds: z.number().positive(),
  carryOver: z.object({ priorEndState: z.string().min(1) }).strict().optional(),
  storyboardReference: z.object({ source: z.literal("current-item") }).strict().optional(),
  shots: z.array(videoDescShotSchema).min(1),
}).strict().superRefine((value, ctx) => {
  const duration = value.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  if (Math.abs(duration - value.groupDurationSeconds) > 1e-9) ctx.addIssue({ code: "custom", message: "DURATION_MISMATCH" });
  const rows = value.shots.map((shot) => shot.sourceRow);
  if (new Set(rows).size !== rows.length) ctx.addIssue({ code: "custom", message: "DUPLICATE_SOURCE_ROW" });
  if (rows.some((row, index) => index > 0 && row <= rows[index - 1])) ctx.addIssue({ code: "custom", message: "NON_MONOTONIC_SOURCE_ROW" });
  if (value.unit === "single-shot" && value.shots.length !== 1) ctx.addIssue({ code: "custom", message: "SINGLE_SHOT_CARDINALITY" });
  if (value.unit === "storyboard-assisted" && (value.shots.length !== 1 || !value.storyboardReference)) {
    ctx.addIssue({ code: "custom", message: "STORYBOARD_ASSISTED_CARDINALITY" });
  }
  if (value.unit === "text-multi-reference-group" && value.storyboardReference) {
    ctx.addIssue({ code: "custom", message: "TEXT_MODE_FORBIDS_STORYBOARD_REFERENCE" });
  }
  if (value.unit === "single-shot" && value.storyboardReference) {
    ctx.addIssue({ code: "custom", message: "SINGLE_SHOT_FORBIDS_STORYBOARD_REFERENCE" });
  }
});
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
  | "DURATION_MISMATCH"
  | "DUPLICATE_SOURCE_ROW"
  | "NON_MONOTONIC_SOURCE_ROW"
  | "SINGLE_SHOT_CARDINALITY"
  | "STORYBOARD_ASSISTED_CARDINALITY"
  | "TEXT_MODE_FORBIDS_STORYBOARD_REFERENCE"
  | "SINGLE_SHOT_FORBIDS_STORYBOARD_REFERENCE";
export interface VideoDescParseError { code: VideoDescParseErrorCode; message: string; }
export type VideoDescParseResult =
  | { ok: true; value: VideoDescV2; source: "v2" | "legacy" }
  | { ok: false; error: VideoDescParseError };

export function serializeVideoDesc(value: VideoDescV2): string;
export function parseStoredVideoDesc(raw: string): VideoDescParseResult;
export function decodeLegacyVideoDesc(raw: string): VideoDescParseResult;
```

The serializer constructs a canonical object with a fixed top-level, shot, and dialogue property
order before calling `JSON.stringify`; equivalent objects with different insertion orders therefore
produce byte-identical compact JSON. No database schema change is required. The legacy decoder is
the only runtime module allowed to contain `承接上镜：`,
`该组分镜行原文：`, `序号`, and `音效：`.

The decoder normalizes Chinese, English, and Vietnamese aliases for shot size, camera movement,
dialogue kind, and no-dialogue values into the ASCII enums. It returns typed errors for an invalid
duration, missing cells, duplicate/non-monotonic shot numbers, empty descriptions, or unsupported
closed vocabulary. It never asks the LLM to repair malformed structure.

The alias table must preserve distinctions present in source data: `大远景/大全景 -> extreme-wide`,
`远景 -> long-shot`, `全景 -> wide`, `中景 -> medium`, `中近景/近景 -> medium-close`,
`特写 -> close-up`, and `大特写 -> extreme-close-up`. Camera aliases cover `推/推进/缓推`,
`拉/拉远/缓拉`, `摇/摇镜`, `移`, `俯拍`, `仰拍`, `固定/静止`, `跟踪/跟拍`, `甩镜`,
`升降`, `环绕`, `手持微晃`, and `一镜到底` without collapsing an unsupported value silently.

Map a Zod custom issue whose message is one of the public semantic codes to that exact code; map
all other schema issues to `INVALID_V2`. The agent can declare only
`storyboardReference: { source: "current-item" }` because the database id does not exist until the
tool persists the row. Prompt preparation resolves that discriminant against the outer storyboard
record; non-storyboard units forbid the field.

## 5. Prompt input envelope

Create `src/lib/videoPrompt/input.ts`:

```ts
export interface VideoPromptInputV2 {
  contract: "toonflow.video-prompt-input/v2";
  model: { name: string; mode: string };
  assets: Array<{
    id: number;
    type: "role" | "scene" | "prop" | "audio";
    name: string;
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
  modelName: string;
  mode: string;
  assets: Array<{ id: number; type: "role" | "scene" | "prop" | "tool" | "audio"; name: string; audioAssetId?: number }>;
  storyboards: Array<{ id: number; videoDesc: string; duration: string | number | null }>;
}): BuildVideoPromptInputResult;
```

Single and batch routes must share one repository/service function for:

1. loading storyboard/assets;
2. parsing every stored `videoDesc`;
3. selecting the locale/model prompt;
4. building the JSON user message;
5. validating the returned model prompt.

This removes XML attribute injection and accidental comma-joining of `storyboard.map(...)`.
The route normalizes legacy `tool` assets to canonical `prop`; the Seedance template renders
`prop` as its provider-facing `tool` vocabulary only at the model boundary.

Each stored storyboard input includes its outer `id` and `duration`. For a text-multi-reference
group, missing/non-numeric duration returns `MISSING_OUTER_DURATION`; a numeric mismatch returns
`OUTER_DURATION_MISMATCH`. Other units do not use the outer group duration for semantic comparison.
For storyboard-assisted input, prompt preparation resolves `{ source: "current-item" }` to the
outer record's id in `resolvedStoryboardReference` after persistence.

## 6. Seedance output contract

The prompt generator receives every `storyboardGroups[].videoDesc` and emits one prompt with exactly
three semantic parts:

1. subject/reference definitions;
2. optional carry-over data once, followed by every shot in `sourceRow` order;
3. style and constraints.

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

Tests capture the actual payload passed to `Ai.Text().invoke()` or `Ai.Image().run()` and use ASCII
sentinels for dynamic data. Static checks validate shipped templates and application-authored
wrappers. Sampled provider QA evaluates generated output; this design does not attempt to infer
provenance or reject mixed-language free-form model output at runtime.

Fixed translation/legacy policy stays in `docs/i18n/prompt-terms.json`. Provider evidence is stored
separately in `docs/i18n/provider-protocol.json`; a typed runtime builder enumerates complete tokens
for the actual asset cardinality. Static scans recognize only complete numbered/placeholder token
shapes, while payload tests permit only the exact list generated for that request. Old structural
markers are `legacy-decode-only` and may occur only in `src/lib/videoDesc/legacy.ts` and compatibility
fixtures. Stored database enums do not enter prompts.

`i18n-ignore` is not sufficient for model-facing prompt prose.

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

Every bundle sub-patch validates all anchor cardinalities before writing. A second run is byte
identical. Chinese locale output remains unchanged. The build/release process runs the patch suite
in a fixed order; merely changing a patch script without regenerating `data/web/index.html` is a
failed release.

Backend hardening adds a stable Model Mapping `key` and corrects the inverse `findIndex` predicate
in `upVendorModel.ts`. Director cover artwork becomes text-free so one asset works in every locale.

Merged PR #15 remains a separate, intentional boundary: the batch-import UI chooses its editable
default chapter regex from the interface locale, while `/script/getAiRegex` uses `prompt_language`
only for its model instruction and infers the actual headings in the submitted script. That helper
is invoked by the user-facing importer, not by the script/director/production agents, and it has no
role in decoding `videoDesc`.

## 11. Compatibility and rollout

1. Land prompt/manifest primitives, then complete the medieval canonical-English plus Vi/Zh corpus.
2. Ship the v2 parser and legacy decoder alone; it changes no writes or model requests.
3. Release producer writes, route normalization, JSON envelopes, rewritten templates, and guarded
   seed recognition atomically. A producer must never write v2 JSON while the active template still
   expects the old marker/pipe grammar.
4. Keep known old English seed variants in `promptSeedSync` so untouched installs upgrade; never
   overwrite `useData`, hand-edited seed text, or an explicit locale-pinned model prompt.
5. Adopt strict readers and tighten scanners only after all required sidecars/templates exist.
6. Apply and verify frontend patches, then run the end-to-end QA flow in `en`, `vi`, and `zh`.

No destructive bulk database rewrite is required. Existing rows decode on read. A later background
backfill may rewrite only rows successfully decoded from a known legacy grammar.

Explicit user overrides are an exception to the shipped-prompt guarantee. If a user pins a Chinese
model-prompt file or edits `o_prompt.useData`, the UI must label it as a custom/pinned override;
strict mode may warn or reject it, but migration must not overwrite it silently.

## 12. Acceptance criteria

- `prompt_language=en` sends English application-authored prose for every shipped/default model
  route.
- English/Vietnamese Seedance/default prompt files contain no unexpected Han after stripping only
  complete static token shapes backed by verified provider evidence; payload tests allow only the
  exact tokens generated for that request.
- The old Chinese `videoDesc` markers exist only in the legacy decoder, compatibility fixtures,
  the Chinese locale, and registry history.
- A legacy record and its equivalent v2 record build byte-identical JSON prompt input.
- All sub-shots from one group reach one LLM request and one three-part Seedance output contract.
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
- Existing Chinese locale behavior remains available.
- `yarn lint`, the full test suite, strict prompt scan, sidecar/manifest/term/glossary gates, and
  browser QA all pass.

## 13. Out of scope

- Translating user-authored dialogue, names, or story text.
- Translating stored database enum values in place.
- Replacing the video-prompt LLM with a deterministic renderer.
- Overwriting custom prompt overrides or explicit locale-pinned bindings.
- Adding backend locales beyond `en`, `vi`, and `zh`.
