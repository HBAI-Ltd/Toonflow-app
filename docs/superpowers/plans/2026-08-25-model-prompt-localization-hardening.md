# Model Prompt Localization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every shipped application-authored model prompt follow `prompt_language` exactly, remove silent Chinese fallback, localize the remaining route prompt shells, and complete strict medieval skill coverage.

**Architecture:** Keep person-facing copy on `getLocale()`/`t()`. Add exact-locale `tPrompt()`, a generic strict `readPromptFile()` for `data/modelPrompt`, and manifest-aware `readPromptSkill()` for `data/skills`. Runtime story data remains verbatim. Route tests capture actual provider payloads. Manifest/sidecar/scanner gates cover every skill Markdown file and fail on untranslated prompt prose.

**Tech Stack:** TypeScript, Express, Vitest, Knex, JSON catalogs, Markdown sidecars, `tsx` validation scripts.

**Spec:** `docs/superpowers/specs/2026-08-25-english-prompt-zero-cjk-design.md`

## Global Constraints

- Implement Tasks 1–5 (including prerequisite Task 2B) and medieval Task 7 on
  `codex/prompt-locale-foundation`. After the
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

**Execution dependency:** follow the ordering in `2026-08-25-i18n-completion-roadmap.md`. In
particular, commit Task 2's manifest/source-locale schema and source-locale-aware sidecar/glossary
validators plus Task 2B's packaged-corpus installer before Medieval Task 7. Task 7 must never run
the old canonical-Chinese validators. Complete Task 7 before any production route adopts strict
art/skill reads, complete Tasks 7 and 7B before Task 6, and complete the video-contract/provider-
evidence plan before Task 7B and the final full-tree gates in Tasks 8–9.

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
| `data/.shipped-content-manifest.json` | Versioned hashes for packaged `skills` and `modelPrompt` content. |
| `scripts/i18n-*` | Hard CI gates for every translated sidecar. |
| `.github/workflows/{debug,release}.yml` | Required shared `i18n:ci` quality gate before merge/package. |

---

### Task 1: Add exact-locale prompt translation

**Files:**

- Modify: `src/i18n/translate.ts`
- Modify: `src/i18n/translate.test.ts`
- Modify: `src/i18n/index.ts`
- Create: `src/i18n/promptError.ts`
- Create: `src/i18n/promptError.test.ts`
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
- Modify: `src/utils/cleanNovel.ts`
- Modify: `src/utils/cleanNovel.test.ts`
- Modify: `src/routes/setting/agentDeploy/agentSetKey.ts`
- Create: `src/routes/setting/agentDeploy/agentSetKey.test.ts`
- Modify: `src/routes/setting/vendorConfig/modelTest.ts`
- Create: `src/routes/setting/vendorConfig/modelTest.test.ts`
- Modify: `src/routes/setting/vendorConfig/modelTest/textTest.ts`
- Create: `src/routes/setting/vendorConfig/modelTest/textTest.test.ts`
- Modify: `src/routes/setting/vendorConfig/modelTest/imageTest.ts`
- Create: `src/routes/setting/vendorConfig/modelTest/imageTest.test.ts`
- Modify: `src/routes/setting/vendorConfig/modelTest/videoTest.ts`
- Create: `src/routes/setting/vendorConfig/modelTest/videoTest.test.ts`
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

`scripts/i18n-audit-prompt-lookups.ts` uses the TypeScript compiler AST plus symbol/alias resolution
to discover every model-client construction and terminal `.run()`, `.invoke()`, or `.stream()` call.
It covers direct members (`u.Ai.Text(...)`), aliased imports/objects, destructured constructors,
computed members (`u.Ai[aiTypeFn[type]](...)`), constructor-to-terminal chains, optional/parenthesized
access, and variables/fields that hold a model client before later invocation. It then traces each
argument, template segment, tool description/schema/result, helper return, imported prompt value,
and literal or `t()`/`tPrompt()` call that can flow into the terminal call. The generated inventory is exact and
sorted by file/span; every segment must be classified as `instruction`, `protocol`, or
`verbatim-data`. Any unclassified literal or catalog call is a hard failure. This discovery must
include current non-route omissions such as `src/utils/cleanNovel.ts`,
`src/routes/setting/agentDeploy/agentSetKey.ts`, and vendor model-test routes; do not maintain a
handwritten scope allowlist.

UI progress, log, and HTTP-error text nested in a model call graph stays on ordinary `t()` only
with an immediately leading `// prompt-ui-only: <reason>` annotation, and the audit proves that the
annotated value does not reach a model argument. Tests cover renamed variables, aliased/imported
helpers, module-scope builders, inline `await getPromptLanguage()`, each of the three AI families,
and an unclassified literal/catalog call. Exact regression fixtures include the current
`vendorConfig/modelTest.ts` computed dispatch `u.Ai[aiTypeFn[type]](...).run(...)`, an aliased
constructor, a destructured constructor, `const client = u.Ai.Text(...); await client.invoke(...)`,
and a client passed through one local helper. Each must be discovered; a prompt segment flowing into
any of them without classification fails. The companion catalog-completeness test
collects literal `tPrompt` keys plus declared dynamic key maps and asserts non-empty `en`, `vi`, and
`zh` values. Route/payload tests migrate every discovered authored segment to exact locale.

- [ ] **Step 5: Map strict translation failures at every execution boundary**

Create the centralized mapper here for `MissingPromptTranslationError` only, because Task 2 has not
created `MissingPromptLocaleFileError` yet. Add stable `content_language` catalog keys containing the
requested locale and safe key. HTTP routes return a typed 4xx, agent/socket tools return a localized
tool error without scheduling downstream work, and background/batch tasks persist a localized
failure reason and terminal state. Tests for all three boundaries assert the exact error code,
localized message, no `Ai.*` invocation, and no partial DB/provider side effect. Task 2B extends the
same mapper for locale-file errors. Do not leak absolute paths or silently fall back.

- [ ] **Step 6: Verify and commit**

```bash
yarn vitest run src/i18n/translate.test.ts src/i18n/promptError.test.ts src/lib/prompts/index.test.ts src/i18n/locale.test.ts src/routes/script/getAiRegex.test.ts src/routes/script/extractAssets.test.ts src/agents/scriptAgent/index.test.ts src/agents/scriptAgent/tools.test.ts src/agents/productionAgent/index.test.ts src/agents/productionAgent/tools.test.ts src/utils/agent/memory.test.ts src/utils/agent/skillsTools.test.ts src/utils/cleanNovel.test.ts src/routes/setting/agentDeploy/agentSetKey.test.ts src/routes/setting/vendorConfig/modelTest.test.ts src/routes/setting/vendorConfig/modelTest/textTest.test.ts src/routes/setting/vendorConfig/modelTest/imageTest.test.ts src/routes/setting/vendorConfig/modelTest/videoTest.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts scripts/i18n-audit-prompt-lookups.test.ts
yarn i18n:audit-prompt-lookups
git add src/i18n src/lib/prompts src/routes/script src/agents src/utils/agent src/utils/cleanNovel.ts src/utils/cleanNovel.test.ts src/routes/setting/agentDeploy/agentSetKey.ts src/routes/setting/agentDeploy/agentSetKey.test.ts src/routes/setting/vendorConfig/modelTest.ts src/routes/setting/vendorConfig/modelTest.test.ts src/routes/setting/vendorConfig/modelTest/textTest.ts src/routes/setting/vendorConfig/modelTest/textTest.test.ts src/routes/setting/vendorConfig/modelTest/imageTest.ts src/routes/setting/vendorConfig/modelTest/imageTest.test.ts src/routes/setting/vendorConfig/modelTest/videoTest.ts src/routes/setting/vendorConfig/modelTest/videoTest.test.ts src/routes/production/assets/batchGenerateAssetsImage.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.ts src/routes/production/workbench/batchGeneratePrompt.test.ts scripts/i18n-audit-prompt-lookups.ts scripts/i18n-audit-prompt-lookups.test.ts package.json
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
- Modify: `scripts/i18n-check-sidecars.ts`
- Modify: `scripts/i18n-check-sidecars.test.ts`
- Modify: `scripts/i18n-check-glossary.ts`
- Modify: `scripts/i18n-check-glossary.test.ts`
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

In the same prerequisite commit, upgrade sidecar and glossary discovery to read `sourceLocale` for
every canonical file. Structural parity and glossary checks compare each non-source variant with
its declared source regardless of whether the canonical file is `en`, `vi`, or `zh`. Fixture tests
cover all three source locales, English-origin non-README files, missing/extra metadata, stale hashes,
and a missing exact locale. These validators must be usable by Task 7; Task 8 only enables them as
full-tree hard gates after corpus completion.

- [ ] **Step 4: Add strict art-manual composition**

Compose localized `prefix.md` plus target Markdown with `readPromptSkill()`. Return empty only when the style/target does not exist at all; throw when the canonical file exists but its required locale is missing.

- [ ] **Step 5: Verify and commit**

```bash
yarn vitest run src/i18n/promptFile.test.ts src/i18n/skillPath.test.ts src/utils/getArtPrompt.test.ts scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-check-glossary.test.ts
git add src/i18n/promptFile.ts src/i18n/promptFile.test.ts src/i18n/skillPath.ts src/i18n/skillPath.test.ts src/i18n/index.ts src/utils/getArtPrompt.ts src/utils/getArtPrompt.test.ts src/utils.ts scripts/i18n-check-manifest.ts scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-check-glossary.ts scripts/i18n-check-glossary.test.ts package.json data/skills/.i18n-source-locales.json data/modelPrompt/.i18n-source-locales.json data/skills/.i18n-manifest.json
git commit -m "feat(i18n): add strict model skill resolution"
```

---

### Task 2B: Install the packaged prompt corpus without destroying user changes

**Files:**

- Modify: `scripts/main.ts`
- Create: `scripts/main.test.ts`
- Create: `scripts/shippedContent.ts`
- Modify: `src/i18n/promptError.ts`
- Modify: `src/i18n/promptError.test.ts`
- Modify: `src/agents/scriptAgent/index.test.ts`
- Modify: `src/agents/productionAgent/index.test.ts`
- Modify: `src/routes/production/assets/batchGenerateAssetsImage.test.ts`
- Modify: `src/routes/production/workbench/generateVideoPrompt.test.ts`
- Modify: `src/routes/production/workbench/batchGeneratePrompt.test.ts`
- Create/regenerate: `data/.shipped-content-manifest.json`
- Modify: `scripts/build.ts`
- Modify: `package.json`

The current installer omits `modelPrompt` from `TARGET_ENTRIES` and removes the entire installed
`skills` directory on every version upgrade. Strict readers are not deployable until the package
can provision their corpus safely.

- [ ] **Step 1: Specify a versioned shipped-content manifest**

Generate a deterministic manifest containing schema/version, package version, and sorted SHA-256
entries for every shipped file under `data/skills` and `data/modelPrompt`. Include directories in
the packaged resource set and fail the build if either tree or its locale metadata is absent.

- [ ] **Step 2: Implement hash-aware installation and recovery**

On a fresh install, copy both trees completely and persist the installed manifest. On upgrade,
compare each destination with the previous shipped hash: overwrite changed shipped files and delete
removed shipped files only when the destination still matches the previous hash. Preserve modified
shipped files, unsuffixed custom prompts, locale-pinned custom files, and other untracked files.
Write deterministic backup/recovery metadata (old/new hash, path, backup path, action, versions)
before changing any eligible destination, perform atomic file replacement, and update the installed
manifest only after success. Never recursively remove `skills` or `modelPrompt`.

- [ ] **Step 3: Test every install/upgrade policy**

Use temporary resource/user-data roots to cover: fresh install provisions `skills` plus
`modelPrompt`; untouched upgrade replaces changed shipped files; a modified shipped skill is
preserved; an unsuffixed custom prompt is preserved; a removed untouched shipped file is deleted;
a removed modified file is retained; and recovery metadata/backups restore every changed or deleted
file after an injected mid-upgrade failure.

- [ ] **Step 4: Extend boundary mapping for locale-file errors**

Now that Task 2 has created `MissingPromptLocaleFileError`, extend Task 1's centralized mapper with a
stable localized code/message containing only the requested locale and safe relative canonical path.
HTTP, agent/socket, and background/batch tests assert the locale-file error is mapped consistently,
stops before provider invocation, schedules no downstream work, and leaves no partial side effect.
Keep the translation-error tests from Task 1 unchanged.

- [ ] **Step 5: Verify and commit before strict readers or Medieval Task 7**

```bash
yarn vitest run scripts/main.test.ts src/i18n/promptError.test.ts src/agents/scriptAgent/index.test.ts src/agents/productionAgent/index.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts
yarn build
git add scripts/main.ts scripts/main.test.ts scripts/shippedContent.ts scripts/build.ts data/.shipped-content-manifest.json src/i18n/promptError.ts src/i18n/promptError.test.ts src/agents/scriptAgent/index.test.ts src/agents/productionAgent/index.test.ts src/routes/production/assets/batchGenerateAssetsImage.test.ts src/routes/production/workbench/generateVideoPrompt.test.ts src/routes/production/workbench/batchGeneratePrompt.test.ts package.json
git commit -m "fix(packaging): preserve and provision prompt corpus"
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
from the provider-token builder owned by Video-plan Task 5. That task also creates
`docs/i18n/provider-protocol.json`, its validator/test, and the package gate. Candidate syntax may be
used only in the approval-gated provider test; `assertPromptSegment()` and release scans reject it
until provider/model/version evidence is verified.

- [ ] **Step 3: Add a reusable route-capture harness**

`promptCapture.ts` captures `system`, every message, tool descriptions/schema, tool results, image
prompt, video prompt, and locale. Guard and route payload fixtures must include Han-bearing verbatim
names, descriptions, dialogue, carry-over, and sound effects. Assert each value is byte-identical in
the captured payload and invocation still occurs, while neighboring application-authored Han
instructions fail before invocation. ASCII sentinels remain useful for authored-shell isolation but
are not sufficient as the verbatim-data regression suite.

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

Define prompt provenance before resolving any binding:

- `shipped-strict`: a shipped canonical prompt resolved through its source map and exact requested
  locale;
- `pinned-locale`: an explicitly locale-suffixed custom/bound file, read byte-identically at its
  pinned locale;
- `custom-unscoped`: an unsuffixed custom prompt, read byte-identically as a user override.

Only `shipped-strict` paths call `modelPromptSourceLocale()`. Pinned and unsuffixed custom files
must never be rejected as unknown shipped paths or rewritten/resolved through a sidecar. Every
result carries `languagePolicy` and versioned `promptInputContract` metadata. Backend list, binding,
and generation tests cover all policies, missing files, and exact bytes; the companion web plan
renders localized badges/warnings and contract compatibility before save or invocation.

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

- [ ] **Step 5: Verify with the already-landed arbitrary-source-locale validators and commit**

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

After the video compatibility PR, discovery includes canonical-English
`data/modelPrompt/video/legacy-v1-compat.md` plus its exact Vi/Zh variants. Its effective English and
Vietnamese authored text is subject to the same zero-Han gate. The locked old seed module is
recognition/migration data, not a resolvable prompt-corpus entry, and tests assert it is never
selected at runtime.

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

### Task 8: Enable full-tree manifest, sidecar, glossary, and scan gates

**Files:**

- Modify: `scripts/i18n-check-manifest.ts` and test
- Modify: `scripts/i18n-check-sidecars.ts` and test
- Modify: `scripts/i18n-scan.ts` and test
- Modify: `scripts/i18n-check-glossary.ts` and test
- Modify: `package.json`
- Regenerate: `data/skills/.i18n-manifest.json`, `docs/i18n/sidecar-budget.json`

- [ ] **Step 1: Enable the Task 2 foundation validators across the full tree**

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

- [ ] **Step 4: Add the single CI/release owner**

Add `i18n:ci` to `package.json`; it runs lint, the full test suite, manifest, sidecars, strict
glossary, terms, provider evidence, AST prompt-callsite audit, corpus inventory, and CJK scan.
Update `.github/workflows/debug.yml` to trigger against `master` (not `main`) and expose a required
`quality` job that runs `yarn i18n:ci`. Update `.github/workflows/release.yml` so packaging depends
on the identical quality job rather than duplicating or omitting checks. Workflow fixture tests
assert the base branch, job dependency, and command.

- [ ] **Step 5: Run and commit gates**

```bash
yarn vitest run scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-scan.test.ts scripts/i18n-check-glossary.test.ts
yarn i18n:update-manifest
yarn i18n:check-manifest
yarn i18n:check-sidecars
yarn i18n:check-glossary --strict
yarn i18n:scan
 yarn i18n:ci
git add scripts/i18n-check-manifest.ts scripts/i18n-check-manifest.test.ts scripts/i18n-check-sidecars.ts scripts/i18n-check-sidecars.test.ts scripts/i18n-scan.ts scripts/i18n-scan.test.ts scripts/i18n-check-glossary.ts scripts/i18n-check-glossary.test.ts package.json data/skills/.i18n-manifest.json docs/i18n/sidecar-budget.json .github/workflows/debug.yml .github/workflows/release.yml
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
yarn i18n:ci
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
