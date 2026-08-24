# i18n guide

This document is for anyone maintaining or extending internationalisation in this fork. It covers
how the runtime works, how to add a string, when *not* to add a string to the catalog, and how to
carry this work through an upstream sync.

## 1. The three locales

`src/i18n/types.ts` defines the supported locales:

```ts
export const LOCALES = ["en", "vi", "zh"] as const;
export const DEFAULT_LOCALE: Locale = "en";
export const FALLBACK_LOCALE: Locale = "zh";
```

- **`en`** — English. Default locale for new installs and for any request that carries no locale
  signal at all.
- **`vi`** — Vietnamese.
- **`zh`** — Chinese. This is *not* a normal third locale: `zh.json` holds the **original Chinese
  strings verbatim**, unmodified from before this fork's translation work. It exists so the
  upstream project (`HBAI-Ltd/Toonflow-app`) and any Chinese-speaking user keep the exact original
  behavior, and it doubles as `FALLBACK_LOCALE` — `t()` falls back to `zh` (never to `en`) whenever
  a key is missing from the active catalog. This matters because `en` and `vi` are translations
  that could plausibly lag behind `zh`; falling back to the original text is safer than falling
  back to a possibly-stale English string.

Each catalog lives at `src/i18n/locales/{en,vi,zh}.json`, roughly 390 keys each, flat
`"dot.separated.key": "value"` maps with `{placeholder}` interpolation (see `interpolate()` in
`src/i18n/translate.ts`).

## 2. How the active locale is chosen, and how to change it

`getLocale(req?)` in `src/i18n/locale.ts` resolves the locale in this order:

1. The `X-Toonflow-Lang` request header (accepts both a bare code like `vi` and a full tag like
   `vi-VN` — only the language subtag before the first `-` is used).
2. The `o_setting` row where `key = "content_language"` (persisted server-side setting).
3. `DEFAULT_LOCALE` (`"en"`) if neither of the above resolves to a supported locale.

Two routes manage the persisted setting:

- `GET /api/setting/language/getLanguage` — read the current `content_language` setting.
- `POST /api/setting/language/setLanguage` — write it (calls `setLocale()`, which upserts the
  `o_setting` row).

A caller that wants a one-off locale for a single request (without changing the persisted setting)
should send `X-Toonflow-Lang` on that request — it takes priority over the stored setting.

## 3. How to add a new string

1. Pick a key that groups with its neighbors (e.g. `agent.script.extractAssets.assetName`,
   `setting.language.title`). Existing keys in `src/i18n/locales/en.json` show the conventions in
   use.
2. Add the key to **all three** catalogs:
   - `src/i18n/locales/zh.json` — the original Chinese text (if this is a genuinely new string with
     no prior Chinese original, write natural Chinese here anyway, since `zh` is also the fallback
     every other locale falls back to).
   - `src/i18n/locales/en.json` — the English translation.
   - `src/i18n/locales/vi.json` — the Vietnamese translation.
3. Call it with `t(key, vars?, locale?)` from `src/i18n`. `vars` is an object for `{placeholder}`
   interpolation; `locale` defaults to `DEFAULT_LOCALE` if omitted, so pass the resolved locale
   (from `getLocale(req)`) explicitly wherever the caller has one.
4. Run `yarn i18n:scan` before committing — see section 6.

Keep the three catalogs key-for-key identical (same key set, none missing, none extra). A
mismatched key set is the most common source of `[i18n] thiếu khoá dịch: ...` warnings at runtime
(the `t()` fallback logs and returns the raw key when a catalog is missing an entry).

## 4. When NOT to use the catalog — the part that is easy to get wrong

Not every Chinese string in the codebase should go into the catalog. There are three kinds of
string, and mixing them up is the single most likely way to introduce a regression here. This
project already made both mistakes once; both are worth knowing by name.

**(a) Text shown to a user.** UI copy, notification text, AI-facing labels that a human reads —
these belong in the catalog. This is the default case.

**(b) A value stored in, or *compared against*, the database.** Some Chinese strings are not
prose for a human to read — they are values the code matches on: enum-like columns, keys used in
`WHERE` clauses, identifiers persisted once and then looked up by exact string equality later.
Translating these breaks every comparison against the old value. These get **kept in Chinese** and
marked with the `i18n-ignore` pragma (section 5), not moved to the catalog.

**(c) AI-prompt text.** Text that is fed into a model as part of a prompt (system instructions,
few-shot text, prompt templates) is a form of user-facing text — the "user" is the model, but the
same reasoning as (a) applies: it should be legible in the locale the request is running under. It
goes in the catalog, conventionally under an `agent.*` key prefix (see
`agent.script.extractAssets.*` in `src/i18n/locales/en.json` for the pattern).

**The rule that actually distinguishes (a)/(c) from (b):**

> "Written to the database" does not make a value internal. What makes it internal is that
> something *compares* against it.

A value can be written to the database and still be pure display text — the mistake is assuming
persistence implies internal-only. The test is whether any code path does `=== value`,
`.where(col, value)`, `.includes(value)`, or similar against that exact string. If nothing compares
against it, it is display text and belongs in the catalog even though it also happens to sit in a
database column.

**Two real examples from this project:**

- **`taskClass` (wrong call, corrected)** — `o_tasks.taskClass` was initially treated as an
  internal value (case b) and left in Chinese. But the frontend renders the stored `taskClass`
  string directly as a filter-chip label in the UI — nothing compares against it, everything just
  displays it. Treating it as internal meant Vietnamese and English users saw a bare Chinese
  category label with no translation. It needed to move into the catalog (see
  `src/lib/migrations/i18nSeed.ts`, which now translates existing `o_tasks.taskClass` rows via a
  `taskClass.*` key family in the catalogs, matching only rows whose value still equals the old
  Chinese seed).
- **`o_tasks.state` (wrong call, corrected the other way)** — `state` was initially treated as
  user-facing text (case a) and translated. This broke task filtering: the frontend hardcodes the
  original Chinese state values (e.g. `"进行中"`, `"已完成"`) as the filter *values* it sends back
  to the API — it compares against them, it doesn't just display them. Translating `state` meant
  the frontend's hardcoded Chinese filter values no longer matched any row, and filtering silently
  returned nothing. `state` was reverted to Chinese and marked `i18n-ignore`.

When you're not sure which case a string is, grep the frontend bundle (`data/web/`) and the routes
that read the column for exact-match comparisons before deciding. Don't guess from where the value
lives (a database column) — decide from what the code does with it.

## 5. The `i18n-ignore` pragma

A Chinese string that must stay Chinese (case b above, or anything else deliberately excluded —
database enum values, AI-prompt fragments *that are actually internal identifiers rather than
prompt prose*, API identifiers) is marked with a trailing or preceding comment containing the
literal text `i18n-ignore`, e.g.:

```ts
zh: "剧本Agent", // i18n-ignore — old seed value, comparison-only
```

`scripts/i18n-scan.ts` honours the pragma **on the hit's own line, or on the line immediately
above it** — see `scanLines()`: `lineHasPragma || prevLineHasPragma`. A pragma anywhere else (two
lines up, end of a multi-line block) does not suppress the hit.

`TODO(i18n):` is a different marker, and means something different: it marks a **deferral**, not a
decision. It says "this Chinese string has not been evaluated yet — don't assume it's fine to
leave, and don't assume it needs translating." `i18n-ignore` says "this was evaluated, and it must
stay Chinese." Never write `TODO(i18n):` as a substitute for making the (a)/(b)/(c) call — resolve
it one way or the other and use the right marker.

## 6. Skill-manual sidecars — and why originals are never edited

The 23 skill manuals under `data/skills/**` (`README.md` in each skill directory) are translated as
**sidecar files**, not by editing the original:

- `README.md` — untouched original (Chinese).
- `README.en.md`, `README.vi.md` — translated sidecars, read by `readLocalizedSkill()` /
  `localizedSkillPath()` in `src/i18n/skillPath.ts`. `localizedSkillPath(path, locale)` maps
  `.../README.md` + `"vi"` → `.../README.vi.md` (for `zh`, it returns the original path directly,
  since `zh` *is* the original). `readLocalizedSkill()` tries the localized path first and falls
  back to the original if the sidecar is missing or unreadable.
- `data/skills/.i18n-manifest.json` — records, per original file, the SHA-256 of the Chinese
  source at translation time (`sourceHash`) and which locales have a sidecar (`translated: ["en",
  "vi"]`). Run `yarn i18n:check-manifest` (`scripts/i18n-check-manifest.ts`) to recompute the
  hash of every original and compare it against `sourceHash` — it reports which sidecars are
  stale and which originals have no manifest entry at all, and exits non-zero if anything is
  stale or missing. Run it after every upstream merge that touches `data/skills/**`.

**Scope: most markdown files under `data/skills/**` are not covered by this system at all.**
Only the 23 `README.md` files (one per skill directory) have sidecars and a manifest entry. The
remaining ~160 markdown files nested under skill directories — `art_prompt/*.md`, `prefix.md`,
`driector_skills/*.md`, and similar — have no `.en.md`/`.vi.md` sidecar and are not in the
manifest. There is no localized-path fallback logic for them beyond what `readLocalizedSkill()`
already does (fall back to the original when no sidecar exists), so `en`/`vi` users opening one
of these files in the manual editors are shown the original Chinese content as-is. This is the
current scope, not a bug to chase down file-by-file — extending sidecar coverage to these files
is future work.

**Known limitations that are visible to users today, not caused by a missing translation:**

- `o_tasks.state` renders raw Chinese (`进行中` / `已完成` / `生成失败`) in the task table's
  State column for **every** locale, including `en` and `vi`. This is deliberate: the frontend
  hardcodes those exact Chinese strings as its filter values, so translating what the backend
  stores would silently break status filtering in the UI. Fixing this for real requires a
  frontend change — the filter values need to become locale-independent (e.g. stable enum keys
  the frontend translates for display) before the backend can safely localize `state`.
- Locale-frozen `taskClass` values accumulate in the category dropdown over time.
  `getTaskCategories` groups tasks by the literal stored `taskClass` string. The seed migration
  (`migrateTaskClass` in `src/lib/migrations/i18nSeed.ts`) only rewrites the original Chinese
  seed values, and only runs once per row (matched by exact string). After a user switches
  language, tasks created before the switch keep their old-locale `taskClass` label and tasks
  created after get the new one — both appear permanently as separate entries in the category
  dropdown. There is no cleanup pass that merges them.

**Never edit an original `README.md` under `data/skills/**` directly to "fix" a translation.**
Two reasons:

1. It defeats the whole point of the sidecar design — the original is supposed to stay a faithful
   copy of upstream content so future merges diff cleanly.
2. It is silently a no-op on any machine where the app is already installed. `scripts/main.ts`
   copies bundled directories (including `skills`) into the Electron `userData` directory on
   startup, and the copy is one-way and non-destructive:

   ```ts
   // scripts/main.ts:18
   entry.isDirectory() ? copyDir(s, d) : fs.existsSync(d) || fs.copyFileSync(s, d);
   ```

   `fs.existsSync(d) || fs.copyFileSync(s, d)` only copies a file if the destination doesn't
   already exist. On an installed machine, the skill files already exist in `userData` from a
   previous run, so a new build's edited original never overwrites them. If you "fix" an original
   by editing it in the repo, that fix ships in the next build but has zero effect on anyone who
   already has the app installed — it looks correct in the repo and does nothing in the field.

If a translation needs fixing, edit the `.en.md` / `.vi.md` sidecar, not the original.

## 7. Scripts

- **`yarn i18n:scan`** (`scripts/i18n-scan.ts`) — scans `src/**/*.ts`, `data/vendor/*.ts`,
  `scripts/*.ts`, and `README.md` / `docs/README.en.md` / `docs/README.vi.md` for CJK characters,
  excluding `i18n-ignore`-pragma'd lines, `src/i18n/locales/zh.json`, `src/lib/vendor.json`,
  `src/router.ts`, and `*.test.ts`. Exits non-zero if any CJK remains outside those exclusions.
  This is the project's i18n regression gate — run it before committing anything that touches
  strings.
- **`yarn i18n:check-terms`** (`scripts/i18n-check-terms.ts`) — verifies `docs/i18n/prompt-terms.json`,
  the term registry for the AI pipeline's machine-matched boundary, against the tree. The registry is
  narrower and stricter than `docs/i18n/glossary.json`: it holds only tokens that one layer *emits* and
  another *matches* — the `videoDesc` field names and their closed value vocabularies, the structural
  markers the parser splits on, the format keys the video model must receive verbatim, and the tokens
  that must never be translated in any locale (persisted state values, schema enums, tool names, model
  identifiers, `@图N` / `@图片N`). Each entry records its `zh` / `en` / `vi` forms, a `policy` saying
  whether the token itself may be translated, the boundary it crosses, and raw occurrence counts in each
  layer as evidence. The checker asserts that every `zh` form is still present where the registry says it
  is, that tokens which survived translation before still survive it, that the `en` / `vi` forms the
  registry lists are the ones actually in the translated files, that runtime labels and the prompt spec
  that matches them move together, and that nothing contradicts the glossary without a declared reason.
  Run `tsx scripts/i18n-check-terms.ts --update` after an intentional change to refresh the recorded
  counts, and `--limits` to print what the check cannot detect. **It is not a substitute for reading the
  registry** — it verifies what is in it, and cannot discover a boundary term nobody has added.
- **`yarn i18n:patch-web`** (`scripts/patch-web-i18n.ts`) — patches missing menu-label keys into
  the prebuilt frontend bundle in `data/web/`, since that bundle is generated from
  `Toonflow-web` and isn't rebuilt from source in this repo. Re-run it whenever `data/web/`
  changes. A second run with nothing left to patch reports that there's nothing to do — that's the
  expected steady state.
- **`yarn vendor2json`** (`scripts/vendor2json.ts`) — regenerates `src/lib/vendor.json` from the
  translated `data/vendor/*.ts` sources. Run it after touching anything in `data/vendor/`, and
  always after resolving a merge conflict there (see section 8).

## 8. Upstream-sync procedure

Adapted from section 6 of
`docs/superpowers/specs/2026-08-23-i18n-translation-design.md`.

1. `git fetch upstream && git merge upstream/master`.
2. **Areas that never conflict:** the original files under `data/skills/**` (only sidecars were
   added, originals untouched).
   Most Chinese comments in `src/**` were left in place, but this is not a blanket guarantee —
   this branch also added `i18n-ignore` pragma comments, rewrote several comments to English
   (see e.g. `src/lib/migrations/i18nSeed.ts`), and translated comment-only files such as
   `docs/i18n/README.md` itself. A merge touching one of those specific comment lines can still
   conflict; only comment lines this branch never touched are conflict-free.
3. **Areas that reliably conflict when upstream touches them:**
   - `data/vendor/*.ts` — translated in place (see section 3.5 of the design doc); any upstream
     edit to a vendor file collides with the English text here.
   - String-bearing lines in `src/**` — any line upstream edits that also had its literal moved
     into the catalog collides.
   - **`README.md` at the repo root** — this fork's root README is a rewritten English page
     (adapted from `docs/README.en.md`), not the original Chinese content upstream still ships.
     This one *will* conflict on effectively every upstream README edit. It's an accepted,
     deliberate cost (see the design note in this fork's Task 11 report): the alternative was
     shipping a Chinese front page to an English/Vietnamese-first fork audience. The original
     Chinese content is preserved untouched at `docs/README.zh.md` for reference and for anyone
     who wants to diff it against upstream's `README.md` directly.
   These conflicts are all single-line content conflicts, resolved by hand — a different kind of
   problem than the 183-file conflict storm avoided by not touching skill-manual originals.
4. Run `yarn i18n:scan` to find new untranslated CJK strings introduced by the merge in
   `src/**`/`scripts/*.ts`/`data/vendor/*.ts`/the READMEs it covers. Run `yarn i18n:check-manifest`
   separately to find which `data/skills/**` translations are now stale (their original changed
   since it was last translated) — `i18n:scan` does not look at skill-manual originals or
   sidecars, `i18n:check-manifest` is the tool for that.
5. Re-run `yarn i18n:patch-web` if `data/web/` changed.
6. Re-run `yarn vendor2json` after resolving conflicts in `data/vendor/`, so `src/lib/vendor.json`
   matches the source again.

## 9. Quick reference

| Task | Where |
|---|---|
| Translate function | `t(key, vars?, locale?)` — `src/i18n/index.ts` |
| Resolve request locale | `getLocale(req?)` — `src/i18n/locale.ts` |
| Persist a locale choice | `setLocale(locale)` — `src/i18n/locale.ts` |
| Read/write the setting via HTTP | `GET`/`POST /api/setting/language/{get,set}Language` |
| Locale override per request | `X-Toonflow-Lang` header |
| Catalogs | `src/i18n/locales/{en,vi,zh}.json` |
| Skill sidecar resolution | `src/i18n/skillPath.ts` |
| Skill translation manifest | `data/skills/.i18n-manifest.json` |
| Prose terminology | `docs/i18n/glossary.json` |
| Pipeline boundary term registry | `docs/i18n/prompt-terms.json` — `yarn i18n:check-terms` |
| Seed migration for installed machines | `src/lib/migrations/i18nSeed.ts` |
| CJK regression gate | `yarn i18n:scan` |
| Frontend bundle patch | `yarn i18n:patch-web` |
| Vendor catalog regen | `yarn vendor2json` |
