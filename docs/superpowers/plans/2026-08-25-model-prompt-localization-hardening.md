# Model Prompt Localization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shipped application-authored model prompt follow `prompt_language` exactly, remove silent Chinese fallback, localize the remaining route prompt shells, and complete strict medieval skill coverage.

**Architecture:** Keep person-facing copy on `getLocale()`/`t()`. Add exact-locale `tPrompt()`, a generic strict `readPromptFile()` for `data/modelPrompt`, and manifest-aware `readPromptSkill()` for `data/skills`. Runtime story data remains verbatim. Route tests capture actual provider payloads. Manifest/sidecar/scanner gates cover every skill Markdown file and fail on untranslated prompt prose.

**Tech Stack:** TypeScript, Express, Vitest, Knex, JSON catalogs, Markdown sidecars, `tsx` validation scripts.

**Spec:** `docs/superpowers/specs/2026-08-25-english-prompt-zero-cjk-design.md`

## Global Constraints

- Implement Tasks 1–5, Task 2, and medieval Task 7 on `codex/prompt-locale-foundation`. After the
  video/provider PR merges, implement Tasks 7B, 6, 8, and 9 on a fresh
  `codex/prompt-corpus-zero-han`. Never work directly on `master`; push and open one PR per branch
  after its own verification.
- `content_language` controls person-facing text; `prompt_language` controls model-facing text.
- `tPrompt()` requires the exact selected locale and never falls back.
- Model-facing static-file reads fail before invocation when the requested locale is unavailable.
- English/Vietnamese prompt prose may contain Han only as verified provider protocol tokens or verbatim runtime data.
- Chinese style prose is not an English/Vietnamese exception.
- Do not translate stored state enums or change `o_prompt.useData`.
- Do not use broad file-level CJK exemptions, broad token fragments, or new `i18n-ignore` pragmas for prompt prose.
- Preserve user/DB values byte-for-byte; route tests use ASCII sentinels to isolate authored wrappers.

**Execution dependency:** follow the ordering in `2026-08-25-i18n-completion-roadmap.md`. In particular, establish the Task 2 manifest schema before using its strict reader, complete Task 7 before any production route adopts strict art/skill reads, complete Tasks 7 and 7B before Task 6, and complete the video-contract/provider-evidence plan before Task 7B and the final strict repository gates in Tasks 8–9.

## File Structure

| File | Responsibility |
|---|---|
| `src/i18n/translate.ts` | Exact-locale `tPrompt()` and missing-key error. |
| `src/i18n/promptFile.ts` | Source-locale-aware strict selection for non-skill prompt files. |
| `src/i18n/skillPath.ts` | Manifest-aware strict skill prompt selection. |
| `src/i18n/promptGuard.ts` | Closed-literal and unexpected-Han assertions. |
| `src/utils/getArtPrompt.ts` | Strict visual-manual prompt composition. |
| `src/lib/prompts/*` | Complete per-locale shipped seeds. |
| Six route families below | Locale-driven model prompt wrappers. |
| `data/skills/**` | Explicit medieval en/vi/zh model-facing content. |
| `data/skills/.i18n-manifest.json` | Source locale, hash, required prompt locales. |
| `scripts/i18n-*` | Hard CI gates for every translated sidecar. |

---

### Task 1: Add exact-locale prompt translation

**Files:**

- Modify: `src/i18n/translate.ts`
- Modify: `src/i18n/translate.test.ts`
- Modify: `src/i18n/index.ts`
- Modify: `src/lib/prompts/types.ts`
- Modify: `src/lib/prompts/index.ts`
- Modify: `src/lib/prompts/index.test.ts`
- Modify: `src/routes/script/getAiRegex.ts`
- Modify: `src/routes/script/getAiRegex.test.ts`
- Modify: `src/routes/script/extractAssets.ts`
- Modify: `src/routes/script/extractAssets.test.ts`
- Modify: `src/agents/scriptAgent/index.ts`
- Modify: `src/agents/scriptAgent/index.test.ts`
- Modify: `src/agents/scriptAgent/tools.ts`
- Modify: `src/agents/scriptAgent/tools.test.ts`
- Modify: `src/agents/productionAgent/index.ts`
- Modify: `src/agents/productionAgent/index.test.ts`
- Modify: `src/agents/productionAgent/tools.ts`
- Modify: `src/agents/productionAgent/tools.test.ts`
- Modify: `src/utils/agent/memory.ts`
- Modify: `src/utils/agent/memory.test.ts`
- Modify: `src/utils/agent/skillsTools.ts`
- Modify: `src/utils/agent/skillsTools.test.ts`
- Modify: `src/routes/production/assets/batchGenerateAssetsImage.ts`
- Create: `src/routes/production/assets/batchGenerateAssetsImage.test.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.test.ts`
- Modify: `src/routes/production/workbench/batchGeneratePrompt.ts`
- Create: `src/routes/production/workbench/batchGeneratePrompt.test.ts`
- Create: `scripts/i18n-audit-prompt-lookups.ts`
- Create: `scripts/i18n-audit-prompt-lookups.test.ts`
- Modify: `package.json`

**Interfaces:**

```ts
export class MissingPromptTranslationError extends Error {
  constructor(public readonly key: string, public readonly locale: Locale);
}

export function createPromptTranslator(catalogs: Record<Locale, Catalog>): typeof tPrompt;
export function tPrompt(key: string, vars: Record<string, string | number>, locale: Locale): string;
export type LocaleText = Record<Locale, string>;
```

- [ ] **Step 1: Write failing strict-lookup tests**

```ts
const strict = createPromptTranslator({
  en: {},
  vi: {},
  zh: { "test.onlyZh": "仅中文" }
});

expect(() => strict("test.onlyZh", {}, "en")).toThrow(MissingPromptTranslationError);
expect(() => strict("test.onlyZh", {}, "vi")).toThrow(MissingPromptTranslationError);
expect(strict("test.onlyZh", {}, "zh")).toBe("仅中文");
```

Keep existing `t()` fallback tests unchanged.

- [ ] **Step 2: Implement exact-catalog lookup**

Reuse interpolation but read only `catalogs[locale]?.[key]`. Throw `MissingPromptTranslationError` when absent. Do not call `t()` and do not read `FALLBACK_LOCALE`.

Switch `/script/getAiRegex` from `t()` to `tPrompt()`. Preserve PR #15's separation: the instruction
uses `prompt_language`, the first 2,000 characters of submitted script remain verbatim, and the
returned regex is used only by the batch-import UI. Extend its existing en/vi/zh matrix with a
missing-key failure-before-invocation assertion.

- [ ] **Step 3: Make seed texts total**

Change `LocaleText` to `Record<Locale, string>` and make `resolveSeedText(text, locale)` return `text[locale]`. Add a loop test proving every seed type has non-empty `en`, `vi`, and `zh` values and `getSeedPrompt(type, locale) === module[locale]`.

- [ ] **Step 4: Migrate every existing model-facing catalog lookup**

In every file listed above, rename the model-facing locale variable/parameter to `promptLocale` and
replace all model instructions, tool descriptions/schema descriptions/results, memory prompts,
asset/storyboard/model labels, and fallback model text from `t(..., promptLocale)` to
`tPrompt(..., promptLocale)`. Keep UI progress/log/HTTP errors on ordinary `t(..., locale)`.

`scripts/i18n-audit-prompt-lookups.ts` uses the TypeScript compiler AST over an exported
`MODEL_FACING_SCOPES` map of exact file plus function/method names (including module-scope prompt
builders). Inside those scopes, any call bound to the ordinary `t` import fails regardless of its
argument names or whether the locale is inline. The few UI-progress/log/HTTP-error calls nested in a
model function require an immediately leading `// prompt-ui-only: <reason>` annotation; tests prove
an unannotated `t(key, {}, locale)`, renamed parameter, and inline `await getPromptLanguage()` all
fail, while an annotated UI-only call passes. Its companion catalog-completeness test collects
literal `tPrompt` keys plus the declared dynamic key maps and asserts a non-empty value exists in
`en`, `vi`, and `zh`.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/i18n/translate.test.ts src/lib/prompts/index.test.ts src/i18n/locale.test.ts src/routes/script/getAiRegex.test.ts src/routes/script/extractAssets.test.ts src/agents/scriptAgent/index.test.ts src/agents/scriptAgent/tools.test.ts src/agents/productionAgent/index.test.ts src/agents/productionAgent/tools.test.ts src/utils/agent/memory.test.ts src/utils/agent/skillsTools.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts scripts/i18n-audit-prompt-lookups.test.ts
yarn i18n:audit-prompt-lookups
git add src/i18n src/lib/prompts src/routes/script src/agents src/utils/agent src/routes/production/assets/batchGenerateAssetsImage.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.ts src/routes/production/workbench/batchGeneratePrompt.test.ts scripts/i18n-audit-prompt-lookups.ts scripts/i18n-audit-prompt-lookups.test.ts package.json
git commit -m "feat(i18n): add exact-locale model prompt translation"
```

---

### Task 2: Add strict, source-locale-aware prompt file resolution

**Files:**

- Modify: `src/i18n/skillPath.ts`
- Modify: `src/i18n/skillPath.test.ts`
- Create: `src/i18n/promptFile.ts`
- Create: `src/i18n/promptFile.test.ts`
- Modify: `src/i18n/index.ts`
- Modify: `src/utils/getArtPrompt.ts`
- Modify: `src/utils/getArtPrompt.test.ts`
- Modify: `src/utils.ts`
- Modify: `scripts/i18n-check-manifest.ts`
- Modify: `scripts/i18n-check-manifest.test.ts`
- Modify: `package.json`
- Create: `data/skills/.i18n-source-locales.json`
- Create: `data/modelPrompt/.i18n-source-locales.json`
- Modify: `data/skills/.i18n-manifest.json`

**Interfaces:**

```ts
export interface SkillManifestEntry {
  sourceHash: string;
  sourceLocale: Locale;
  translated: Locale[];
}

export class MissingPromptLocaleFileError extends Error {
  constructor(public readonly canonicalPath: string, public readonly locale: Locale);
}

export function canonicalPromptPath(filePath: string): string;
export function localeSidecarPath(canonicalPath: string, locale: Locale): string;
export function modelPromptSourceLocale(canonicalPath: string): Locale;
export function readPromptFile(canonicalPath: string, locale: Locale, sourceLocale: Locale): string;
export function resolvePromptSkillPath(canonicalPath: string, locale: Locale): string;
export function readPromptSkill(canonicalPath: string, locale: Locale): string;
export function getRequiredLocalizedArtPrompt(style: string, source: string, file: string, locale: Locale): string;
```

- [ ] **Step 1: Define and test the manifest schema first**

Extend every manifest entry with `sourceLocale`. Add deterministic discovery of every canonical
`data/skills/**/*.md`, a sorted writer, and `yarn i18n:update-manifest`. The update command accepts
the committed `data/skills/.i18n-source-locales.json`, whose schema is
`Record<repoRelativeCanonicalMarkdownPath, Locale>`. Populate one reviewed entry for every canonical
skill Markdown file (198 at baseline), require exact set equality with discovery, reject locale
sidecars/unknown paths/missing paths, write hashes/available non-source locales, never edit Markdown,
and fail rather than guessing an unknown source language.

Create the authoritative runtime map `data/modelPrompt/.i18n-source-locales.json` with the same
record schema. It contains the four canonical `data/modelPrompt/video/*.md` paths at baseline, all
reviewed as `zh` origin. `modelPromptSourceLocale()` rejects unknown paths. Task 6 callers and the
Task 7B static inventory must both read this one map rather than duplicating source-locale facts.

- [ ] **Step 2: Write failing resolver tests**

Fixtures cover a Chinese-origin canonical file with `.en/.vi` sidecars and an English-origin
canonical file with `.vi/.zh` sidecars. Assert exact locale selection, `sourceLocale` behavior, and
an exception when any requested model prompt file is absent. `localeSidecarPath()` must be able to
form `.en.md`, `.vi.md`, and `.zh.md`; `canonicalPromptPath()` must strip all three. Keep the existing
viewer-friendly `localizedSkillPath()`/`readLocalizedSkill()` behavior and tests unchanged.

- [ ] **Step 3: Implement generic and skill-specific strict resolution**

For `data/modelPrompt`, callers pass the known `sourceLocale` to `readPromptFile()`; that directory is
not part of the skill manifest. For `data/skills`, `readPromptSkill()` reads `sourceLocale` from the
manifest. In both cases, canonicalize all locale suffixes first, use the canonical file only when the
requested locale equals the source locale, otherwise require the exact sidecar, and never cascade to
another prompt language.

- [ ] **Step 4: Add strict art-manual composition**

Compose localized `prefix.md` plus target Markdown with `readPromptSkill()`. Return empty only when the style/target does not exist at all; throw when the canonical file exists but its required locale is missing.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/i18n/promptFile.test.ts src/i18n/skillPath.test.ts src/utils/getArtPrompt.test.ts scripts/i18n-check-manifest.test.ts
git add src/i18n/promptFile.ts src/i18n/promptFile.test.ts src/i18n/skillPath.ts src/i18n/skillPath.test.ts src/i18n/index.ts src/utils/getArtPrompt.ts src/utils/getArtPrompt.test.ts src/utils.ts scripts/i18n-check-manifest.ts scripts/i18n-check-manifest.test.ts package.json data/skills/.i18n-source-locales.json data/modelPrompt/.i18n-source-locales.json data/skills/.i18n-manifest.json
git commit -m "feat(i18n): add strict model skill resolution"
```

---

### Task 3: Add prompt provenance and Han assertions

**Files:**

- Create: `src/i18n/promptGuard.ts`
- Create: `src/i18n/promptGuard.test.ts`
- Create: `src/test/promptCapture.ts`
- Modify: `docs/i18n/prompt-terms.json`

**Interfaces:**

```ts
export type PromptSegmentKind = "instruction" | "protocol" | "verbatim-data";
export function stripExactLiterals(text: string, literals: readonly string[]): string;
export function findUnexpectedHan(text: string, literals?: readonly string[]): string[];
export function assertPromptSegment(args: { text: string; locale: Locale; kind: PromptSegmentKind; protocolLiterals?: readonly string[] }): void;
```

- [ ] **Step 1: Write failing guard tests**

```ts
expect(findUnexpectedHan("Use @图片1 only.", ["@图片1"])).toEqual([]);
expect(findUnexpectedHan("请输出 @图片1", ["@图片1"])).toContain("请输出");
expect(() => assertPromptSegment({ text: "NAME_SENTINEL", locale: "en", kind: "verbatim-data" })).not.toThrow();
```

- [ ] **Step 2: Implement longest-first exact stripping**

Accept complete literal strings only, sort longest-first, remove exact matches, then report remaining
`/[\u3400-\u9fff]+/g` runs with context. The generic guard accepts only complete literal values passed
by its caller; never register fragments such as `@图片` or `<主体`. `instruction` en/vi throws and
`verbatim-data` is untouched. Production `protocol` segments must receive the exact per-request list
from the provider-token builder owned by Video-plan Task 4. That task also creates
`docs/i18n/provider-protocol.json`, its validator/test, and the package gate. Candidate syntax may be
used only in the approval-gated provider test; `assertPromptSegment()` and release scans reject it
until provider/model/version evidence is verified.

- [ ] **Step 3: Add a reusable route-capture harness**

`promptCapture.ts` captures `system`, every message, tool descriptions/schema, tool results, image prompt, and locale. Tests pass ASCII dynamic values and assert only authored segments.

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/i18n/promptGuard.test.ts
git add src/i18n/promptGuard.ts src/i18n/promptGuard.test.ts src/test/promptCapture.ts docs/i18n/prompt-terms.json
git commit -m "test(prompts): add prompt language assertions"
```

---

### Task 4: Localize asset generation and polishing prompts

**Files:**

- Modify: `src/routes/assetsGenerate/generateAssets.ts`
- Modify: `src/routes/assetsGenerate/batchGenerateImageAssets.ts`
- Modify: `src/routes/assetsGenerate/polishAssetsPrompt.ts`
- Modify: `src/routes/assetsGenerate/batchPolishAssetsPrompt.ts`
- Create: `src/routes/assetsGenerate/promptBuilders.ts`
- Create: `src/routes/assetsGenerate/generateAssets.test.ts`
- Create: `src/routes/assetsGenerate/batchGenerateImageAssets.test.ts`
- Create: `src/routes/assetsGenerate/polishAssetsPrompt.test.ts`
- Create: `src/routes/assetsGenerate/batchPolishAssetsPrompt.test.ts`
- Modify: `src/i18n/locales/{en,vi,zh}.json`

**Interfaces:**

```ts
type AssetType = "role" | "scene" | "tool";
export function buildAssetImagePrompt(args: { type: AssetType; artStyle: string; name: string; prompt: string; locale: Locale }): string;
export function buildAssetPolishMessage(args: { type: AssetType; name: string; description: string; locale: Locale }): string;
```

- [ ] **Step 1: Write failing `en/vi/zh` payload matrices**

For each route, capture actual `Ai.Image().run()` or `Ai.Text().invoke()` input. Test `prompt_language=en, content_language=zh`; `vi/en`; and `zh/en`. Use `STYLE_SENTINEL`, `NAME_SENTINEL`, `PROMPT_SENTINEL`, `DESCRIPTION_SENTINEL`, and `OTHER_TEXT_SENTINEL`. Assert en/vi authored wrappers contain no unexpected Han and sentinels remain unchanged.

- [ ] **Step 2: Add exact catalog keys**

Add these keys in all three catalogs:

```text
prompt.assetsGenerate.image.role.label
prompt.assetsGenerate.image.role.title
prompt.assetsGenerate.image.role.end
prompt.assetsGenerate.image.scene.label
prompt.assetsGenerate.image.scene.title
prompt.assetsGenerate.image.scene.end
prompt.assetsGenerate.image.tool.label
prompt.assetsGenerate.image.tool.title
prompt.assetsGenerate.image.tool.end
prompt.assetsGenerate.image.template
prompt.assetsGenerate.image.unspecifiedArtStyle
prompt.assetsGenerate.polish.role.nameLabel
prompt.assetsGenerate.polish.scene.nameLabel
prompt.assetsGenerate.polish.tool.nameLabel
prompt.assetsGenerate.polish.userMessage
```

The image template interpolates `{title}`, `{artStyle}`, `{label}`, `{name}`, `{prompt}`, and `{end}`. The polish template interpolates `{nameLabel}`, `{name}`, and `{describe}`. Empty art style uses an exact-locale catalog value, not `未指定`.

- [ ] **Step 3: Implement shared builders**

Put both builders in `src/routes/assetsGenerate/promptBuilders.ts`. Resolve prompt-facing copy with
`getPromptLanguage()`/`tPrompt()`. Keep task/UI/error text on `getLocale(req)`/`t()`. Replace
`getArtPrompt()` with `getRequiredLocalizedArtPrompt()` in polish routes only after Task 7 completes.
Preserve `otherTextPrompt` verbatim.

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/routes/assetsGenerate/generateAssets.test.ts src/routes/assetsGenerate/batchGenerateImageAssets.test.ts src/routes/assetsGenerate/polishAssetsPrompt.test.ts src/routes/assetsGenerate/batchPolishAssetsPrompt.test.ts
git add src/routes/assetsGenerate src/i18n/locales/en.json src/i18n/locales/vi.json src/i18n/locales/zh.json
git commit -m "fix(prompts): localize asset generation prompts"
```

---

### Task 5: Localize audio binding and art-style extraction

**Files:**

- Modify: `src/routes/cornerScape/batchBindAudio.ts`
- Create: `src/routes/cornerScape/batchBindAudio.test.ts`
- Modify: `src/routes/artStyle/extractStylePrompt.ts`
- Create: `src/routes/artStyle/extractStylePrompt.test.ts`
- Modify: `src/i18n/locales/{en,vi,zh}.json`

- [ ] **Step 1: Write failing prompt matrices**

Capture audio tool description/schema/result, candidate lines, user message, and selected system seed. Capture art-style extraction system text. Use ASCII asset/audio data and null descriptions. Assert en/vi contain no authored Han; zh uses canonical Chinese; content locale never selects model copy.

- [ ] **Step 2: Add prompt catalog families**

Add these exact keys to every catalog:

```text
prompt.cornerScape.audioBind.resultToolDescription
prompt.cornerScape.audioBind.audioIdDescription
prompt.cornerScape.audioBind.noResponse
prompt.cornerScape.audioBind.emptyDescription
prompt.cornerScape.audioBind.candidateLine
prompt.cornerScape.audioBind.userMessage
prompt.artStyle.extract.system
```

`candidateLine` interpolates `{id}`, `{name}`, and `{describe}`. `userMessage` interpolates `{audioList}`, `{assetId}`, `{assetName}`, `{assetDescribe}`, and `{assetType}`. Include exact-locale empty-description/no-response values; do not use `无` in en/vi.

- [ ] **Step 3: Implement prompt-locale resolution**

Use `getPromptLanguage()` and `tPrompt()` for model text. Keep HTTP errors person-facing. Do not alter stored status values or audio seed override behavior.

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run src/routes/cornerScape/batchBindAudio.test.ts src/routes/artStyle/extractStylePrompt.test.ts
git add src/routes/cornerScape/batchBindAudio.ts src/routes/cornerScape/batchBindAudio.test.ts src/routes/artStyle/extractStylePrompt.ts src/routes/artStyle/extractStylePrompt.test.ts src/i18n/locales/en.json src/i18n/locales/vi.json src/i18n/locales/zh.json
git commit -m "fix(prompts): localize audio and style prompts"
```

---

### Task 6: Switch every model-facing skill reader to strict mode

**Files:**

- Modify: `src/agents/scriptAgent/index.ts`
- Modify: `src/agents/productionAgent/index.ts`
- Modify: `src/utils/agent/skillsTools.ts`
- Modify: `src/routes/setting/modelMap/getPromptList.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.ts`
- Modify: `src/routes/production/workbench/batchGeneratePrompt.ts`
- Modify: `src/routes/production/assets/batchGenerateAssetsImage.ts`
- Modify: `src/routes/production/assets/batchGenerateAssetsImage.test.ts`
- Modify: `src/agents/scriptAgent/index.test.ts`
- Modify: `src/agents/productionAgent/index.test.ts`
- Modify: `src/utils/agent/skillsTools.test.ts`
- Create: `src/routes/setting/modelMap/getPromptList.test.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.test.ts`
- Create: `src/routes/production/workbench/batchGeneratePrompt.test.ts`

- [ ] **Step 1: Add missing-sidecar and exact-locale tests**

For each reader path, assert Chinese-origin files select `.en.md`, `.vi.md`, or canonical Chinese,
while English-origin files select canonical English, `.vi.md`, or `.zh.md` according to the
manifest. A missing requested file throws before any model invocation. Person-facing manual viewers
retain graceful fallback.

- [ ] **Step 2: Replace model-facing `readLocalizedSkill()` calls**

Use `readPromptSkill()` for `data/skills`, and call `readPromptFile()` with
`modelPromptSourceLocale(canonicalPath)` for `data/modelPrompt`; use strict art composition. Preserve
explicit locale-pinned model prompt paths as
user-selected overrides; do not silently reinterpret or rewrite them. Replace all three
`getArtPrompt()` reads in `batchGenerateAssetsImage.ts` with
`getRequiredLocalizedArtPrompt()` and prove a missing exact locale stops before image invocation.

- [ ] **Step 3: Verify and commit**

```bash
yarn vitest run src/i18n/promptFile.test.ts src/i18n/skillPath.test.ts src/utils/getArtPrompt.test.ts src/utils/agent/skillsTools.test.ts src/agents/scriptAgent/index.test.ts src/agents/productionAgent/index.test.ts src/routes/setting/modelMap/getPromptList.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts
git add src/agents src/utils src/routes/setting/modelMap/getPromptList.ts src/routes/setting/modelMap/getPromptList.test.ts src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.ts src/routes/production/workbench/batchGeneratePrompt.test.ts src/routes/production/assets/batchGenerateAssetsImage.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts
git commit -m "fix(prompts): enforce exact model skill locale"
```

---

### Task 7: Complete medieval en/vi/zh prompt files

**Files:**

- Review/modify the canonical English file, retain/update its existing `.vi.md`, and create only a
  new `.zh.md` beside each file below:
  - `data/skills/story_skills/Medieval_epic/README.md`
  - `data/skills/story_skills/Medieval_epic/driector_skills/director_planning_narrative.md`
  - `data/skills/story_skills/Medieval_epic/driector_skills/director_storyboard_table_narrative.md`
  - `data/skills/art_skills/realpeople_medieval_western/README.md`
  - `data/skills/art_skills/realpeople_medieval_western/prefix.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_character.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_character_derivative.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_prop.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_prop_derivative.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_scene.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_scene_derivative.md`
  - `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_storyboard_video.md`
  - `data/skills/art_skills/realpeople_medieval_western/driector_skills/director_planning_style.md`
  - `data/skills/art_skills/realpeople_medieval_western/driector_skills/director_storyboard.md`
  - `data/skills/art_skills/realpeople_medieval_western/driector_skills/director_storyboard_table_style.md`
- Modify: `data/skills/art_skills/realpeople_medieval_western/art_prompt/art_storyboard_video.vi.md`
- Modify: `data/skills/.i18n-manifest.json`

- [ ] **Step 1: Keep canonical English and remove its Chinese prose**

Do not create redundant `.en.md` files: all 15 canonical files are English-origin and already have
`.vi.md` variants. Preserve headings, fences, tables, frontmatter, paths, and protocol tokens. Review
the canonical English instructions/examples and replace the Chinese style row in canonical
`art_storyboard_video.md` with:

```text
medieval epic live-action style, cinematic, natural light and firelight, desaturated color grade, ultra-fine detail
```

The canonical English file must not include the current Chinese style tag.

- [ ] **Step 2: Add explicit Chinese sidecars for English-origin sources**

Translate the 15 English-origin files to natural Chinese under `.zh.md`. The Chinese video-style file may contain the Chinese Seedance style tag. This restores real `prompt_language=zh` behavior without reclassifying the English canonical source as Chinese.

- [ ] **Step 3: Correct the Vietnamese video style**

Replace the Chinese style row in `.vi.md` with:

```text
phong cách sử thi trung cổ người thật, chất điện ảnh, ánh sáng tự nhiên và ánh lửa, phối màu giảm bão hòa, chi tiết cực cao
```

- [ ] **Step 4: Record source locale and required locales**

Set `sourceLocale: "en"` and `translated: ["vi", "zh"]` for these 15 entries. The source locale is
represented by the canonical file and is not duplicated in `translated`. Existing upstream Chinese
sources use `sourceLocale: "zh"` with their non-source sidecars listed in `translated`.

- [ ] **Step 5: Verify and commit**

```bash
yarn i18n:check-sidecars --paths data/skills/story_skills/Medieval_epic data/skills/art_skills/realpeople_medieval_western
yarn i18n:check-glossary --strict --paths data/skills/story_skills/Medieval_epic data/skills/art_skills/realpeople_medieval_western
git add data/skills/story_skills/Medieval_epic data/skills/art_skills/realpeople_medieval_western data/skills/.i18n-manifest.json
git commit -m "feat(skills): complete medieval prompt locales"
```

---

### Task 7B: Remove residual Han prose from the complete English/Vietnamese prompt corpus

**Files:**

- Create: `scripts/i18n-inventory-prompt-corpus.ts`
- Create: `scripts/i18n-inventory-prompt-corpus.test.ts`
- Create/regenerate: `docs/i18n/prompt-corpus-inventory.json`
- Modify: every effective en/vi `data/skills` variant listed by the inventory
- Modify: every en/vi `data/modelPrompt` variant listed by the inventory
- Modify: `package.json`

At the audited baseline, resolved en/vi skill variants contain 2,882 residual Han characters across
107 files after the old fixed-term stripping. Treat those numbers as an initial scope measurement,
not an exemption or a frozen assertion; the inventory command recomputes the exact file/line/token
set after preceding PRs.

- [ ] **Step 1: Generate a deterministic failing inventory**

Resolve `data/skills` through `.i18n-source-locales.json`/the manifest. Discover every canonical
`data/modelPrompt/**/*.md`, require exact coverage in `data/modelPrompt/.i18n-source-locales.json`,
and resolve its exact en/vi variants. The generated inventory records—but does not own—the reviewed
source locale. Emit sorted entries
with canonical path, resolved path, locale, line, Han run, context, and disposition. Test canonical
English, Chinese-origin `.en.md`, canonical Vietnamese, `.vi.md`, missing source-locale metadata, and
stable sorting.

- [ ] **Step 2: Classify without blanket exemptions**

Every hit must be removed by translation or be one complete provider token whose protocol evidence
is verified. Chinese examples, style tags, headings, parser markers, and explanatory prose are
application-authored and must be translated; they are not `verbatim-data`. Legacy marker examples
move to compatibility fixtures/decoder tests. Delete the old sidecar-budget blanket allowance.

- [ ] **Step 3: Translate the bounded inventory**

Update every listed English/Vietnamese prompt variant while preserving frontmatter, Markdown
headings, fences, tables, placeholders, enum values, paths, and tool/schema identifiers. Add
per-family payload/template snapshots so removal of Han does not remove required instructions. Rerun
inventory after each batch until `unresolved` is empty for both locales.

- [ ] **Step 4: Verify and commit**

```bash
yarn vitest run scripts/i18n-inventory-prompt-corpus.test.ts
yarn i18n:inventory-prompt-corpus --check
yarn i18n:check-provider-protocol
git add data/skills data/modelPrompt docs/i18n/prompt-corpus-inventory.json docs/i18n/sidecar-budget.json scripts/i18n-inventory-prompt-corpus.ts scripts/i18n-inventory-prompt-corpus.test.ts package.json
git commit -m "fix(prompts): remove residual Han from English and Vietnamese corpus"
```

---

### Task 8: Finish strict manifest, sidecar, glossary, and scan gates

**Files:**

- Modify: `scripts/i18n-check-manifest.ts` and test
- Modify: `scripts/i18n-check-sidecars.ts` and test
- Modify: `scripts/i18n-scan.ts` and test
- Modify: `scripts/i18n-check-glossary.ts` and test
- Modify: `package.json`
- Regenerate: `data/skills/.i18n-manifest.json`, `docs/i18n/sidecar-budget.json`

- [ ] **Step 1: Enforce the Task 2 manifest across the full tree**

Verify deterministic discovery of every canonical `data/skills/**/*.md`, excluding all locale
sidecars. Require sorted path, SHA-256, explicit `sourceLocale`, and sorted non-source translated
locales. `yarn i18n:update-manifest` never edits Markdown and never guesses source locale.

- [ ] **Step 2: Make missing prompt locales a hard failure**

For each manifest entry, require `en`, `vi`, and `zh` through the canonical source or exact sidecar
according to arbitrary `sourceLocale`. Validate structural parity (frontmatter, headings, fences,
tables, and required protocol tokens) for every non-source locale. Add fixture tests for English- and
Chinese-origin non-README files, stale hashes, sorted output, source-locale mismatch, and a missing
exact locale.

- [ ] **Step 3: Scan every translated sidecar**

Resolve every manifest entry to its effective English and Vietnamese variant, including the canonical
`.md` whenever its `sourceLocale` is `en` or `vi`; do not scan only filename suffixes. Strip only
complete static placeholder/token shapes selected by verified `provider-protocol.json` evidence;
static scanning never pretends to know request asset cardinality. Payload-capture tests instead use
the exact per-request list from the typed provider-token builder. Assert unexpected Han in canonical
English and `.en.md` fixtures fails, while adjacent prose around an allowed complete token still
fails. Chinese variants are required and structurally checked but are not subject to a no-Han rule.

- [ ] **Step 4: Run and commit gates**

```bash
yarn vitest run scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-scan.test.ts scripts/i18n-check-glossary.test.ts
yarn i18n:update-manifest
yarn i18n:check-manifest
yarn i18n:check-sidecars
yarn i18n:check-glossary --strict
yarn i18n:scan
git add scripts/i18n-check-manifest.ts scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-scan.ts scripts/i18n-scan.test.ts scripts/i18n-check-glossary.ts scripts/i18n-check-glossary.test.ts package.json data/skills/.i18n-manifest.json docs/i18n/sidecar-budget.json
git commit -m "test(i18n): enforce complete prompt locales"
```

---

### Task 9: Full prompt-language verification

**Files:** Verify Tasks 1–8 and the video contract plan; change only files implicated by a failing test.

- [ ] **Step 1: Run focused suites**

```bash
yarn vitest run src/i18n/translate.test.ts src/i18n/promptFile.test.ts src/i18n/skillPath.test.ts src/i18n/promptGuard.test.ts src/lib/prompts/index.test.ts src/utils/getArtPrompt.test.ts src/utils/agent/skillsTools.test.ts src/agents/scriptAgent/index.test.ts src/agents/productionAgent/index.test.ts src/routes/script/getAiRegex.test.ts src/routes/setting/modelMap/getPromptList.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts src/routes/assetsGenerate/generateAssets.test.ts src/routes/assetsGenerate/batchGenerateImageAssets.test.ts src/routes/assetsGenerate/polishAssetsPrompt.test.ts src/routes/assetsGenerate/batchPolishAssetsPrompt.test.ts src/routes/cornerScape/batchBindAudio.test.ts src/routes/artStyle/extractStylePrompt.test.ts scripts/i18n-audit-prompt-lookups.test.ts scripts/i18n-inventory-prompt-corpus.test.ts scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-scan.test.ts scripts/i18n-check-glossary.test.ts
```

- [ ] **Step 2: Run repository gates**

```bash
yarn lint
yarn i18n:check-manifest
yarn i18n:check-sidecars
yarn i18n:check-glossary --strict
yarn i18n:check-terms
yarn i18n:check-provider-protocol
yarn i18n:audit-prompt-lookups
yarn i18n:inventory-prompt-corpus --check
yarn i18n:scan
yarn test
```

- [ ] **Step 3: Confirm route contract matrix**

For every model route: `prompt=en/content=zh` is English; `prompt=vi/content=en` is Vietnamese; `prompt=zh/content=en` is Chinese. Missing static locale fails before invocation. ASCII sentinels remain unchanged. No English/Vietnamese authored segment contains unexpected Han.

- [ ] **Step 4: Inspect working tree**

```bash
git diff --check
git status --short
git log --oneline -12
```

Expected: no whitespace errors; only intentional files changed; pre-existing `.gstack/` untouched.
