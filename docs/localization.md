# Interface localization

Toonflow's interface supports Simplified Chinese and English. Choose a language during onboarding or in **Settings > Appearance > Language**. The choice is saved in `settings.ui.locale`, independently of workspace files. Chinese remains the default when the setting is missing or invalid.

Switching languages updates the mounted interface. It does not reload a canvas or translate document content, node names, prompts, model responses, provider names, or third-party plugin content.

## Add interface text

Keep flat JSON catalogs alongside the component or package that owns the text:

```text
locales/zh.json
locales/en.json
```

Use semantic keys and named parameters:

```json
{
  "savedCount": "Saved {count} items"
}
```

```ts
import { createTranslator } from "@toonflow/i18n";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
```

Call `t("savedCount", { count })` from a template, computed value, or event handler. Do not cache translated labels in module-level constants or setup-time arrays: those will not update when the language changes. Keep IDs, enum values, protocol fields, routes, file paths and persisted user data unchanged.

English entries fall back to the Chinese catalog. Unknown keys are returned unchanged. Parameters are replaced once; missing parameters remain literal. Interpolation produces plain strings, not HTML. Use Vue text bindings for translated content.

## Node and tool bundles

The web host binds its settings-backed locale once before mounting. Node and tool bundles can import `createTranslator` without binding another locale or adding a runtime dependency on Vue. Each bundled copy reads the host's current locale through the same global symbol. Calls made during Vue rendering track the host ref.

A standalone bundle with no host uses Chinese. Existing plugins do not need to adopt this package to keep working. Do not translate arbitrary plugin metadata or user labels through a global text-replacement pass. Translate known built-in labels at their rendering boundary and leave unknown labels intact.

Host binding is a mount/unmount lifecycle operation, not a live rebind API. Changing the existing host ref updates consumers; replacing or removing the binding while consumers remain mounted is not supported.

## Error presentation and protocol text

Keep owned errors as `Error` objects until rendering. `createDisplayError(stableMessage, () => t(key, params))` attaches a non-serialized display callback; `getErrorDisplay(error)` reads it reactively in a template or computed value. `error.message` stays the existing machine-facing message. Do not copy the translated display into tool results, agent messages, or canvas result payloads. Server/provider/third-party error text passes through unchanged.

The callback is for same-page node/tool bundles only. JSON or structured cloning does not preserve it; remote consumers receive the stable message, not executable metadata. Switching language must not retry a failed load or generation.

New automatic conversation titles are distinguished from explicit user names. Existing names, node labels, duplicate suffixes, filenames and document text are not translated or migrated by string matching. An existing user name may happen to equal a default label.

If saving settings fails, the current selection remains visible but is not confirmed saved. Settings shows a persistent failure notice and an explicit retry action; a successful save clears it. Reload uses the last successfully saved settings.

## Optional catalog maintenance

The app builds and runs entirely from committed catalogs. It does not call a translation service.

A maintainer can use a catalog tool such as Lingo separately after reviewing its current documentation and upload scope. Lingo's React compiler is not the Vue runtime, and its current extractor does not extract arbitrary hardcoded Vue SFC text. No hosted translation job or CI workflow is configured here. Review translations and placeholder parity before committing generated catalog changes.

## Verification

Follow the existing commands in `CONTRIBUTING.md`. Prepare the Electrobun SDK before the full workspace typecheck when required. Rebuild both the web app and changed node/tool bundles before UI verification.

Use disposable settings and workspace directories. Check language selection and reload persistence, live switching on an open populated canvas, preservation of graph IDs and user content, built-in plugin controls, English layout at enlarged text sizes, and unknown-plugin fallback. Browser checks do not replace native checks for OS dialogs and desktop-only actions.
