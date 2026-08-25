# Toonflow i18n Completion Roadmap

This roadmap coordinates three independently reviewable implementation plans under the shared design:

- [Design spec](../specs/2026-08-25-english-prompt-zero-cjk-design.md)
- [Model prompt localization hardening](2026-08-25-model-prompt-localization-hardening.md)
- [Video prompt contract v2](2026-08-25-video-prompt-contract-v2.md)
- [Web i18n and production flow](2026-08-25-web-i18n-and-production-flow.md)

## Target contract

`prompt_language=en` means zero Chinese application-authored prose. Verbatim story data may remain in its original language. Verified provider reference syntax may remain only on a closed allowlist. Chinese style tags are prose and therefore belong only to Chinese prompt files.

## Required execution order

1. **Prompt and manifest foundations**
   - Model-prompt plan Tasks 1, 2, and 2B.
   - Commit `tPrompt`, the `sourceLocale` manifest/schema, arbitrary-source-locale sidecar and
     glossary validators, locale-neutral resolvers, localized boundary-error mapping, and the
     hash-aware packaged prompt-corpus installer before any corpus or route PR depends on them.
   - This foundation is a complete prerequisite commit. Do not run Medieval Task 7 with the old
     validators that assume every canonical Markdown file is Chinese-origin.
2. **Medieval locale corpus**
   - Model-prompt plan Task 7.
   - Keep the 15 canonical medieval files as English, add `.zh.md` sidecars, retain/update `.vi.md`, and remove Chinese style prose from the English/Vietnamese variants.
3. **Prompt guards and localized route shells**
   - Model-prompt plan Tasks 3–5.
   - Add closed provider-token checks and localize the six known hardcoded route wrappers only after their required corpus is available.
4. **Structured video contract**
   - Video plan Task 1 may land as read-only compatibility only after route-level replay passes for
     every captured historical grammar and the opaque manual-edit case. Tasks 2–6 then land
     atomically in one compatibility release.
   - Add v2 parsing/writes, a canonical JSON envelope, rewritten Seedance/universal/Wan prompts, centralized routes, and quarantined legacy markers/seeds.
5. **Finish the full en/vi prompt corpus**
   - Model-prompt plan Task 7B after the provider protocol gate is verified.
   - Inventory every resolved `data/skills` and `data/modelPrompt` variant, translate all remaining application-authored Han prose, and eliminate the old blanket sidecar budget.
6. **Enable strict model readers everywhere**
   - Model-prompt plan Task 6.
   - Switch agents, model map, and workbench reads only after required locale files exist.
7. **Turn warnings into CI gates**
   - Model-prompt plan Task 8 (enabling full-tree enforcement from the already-landed foundation),
     Task 9, and Video plan Task 7.
   - Add the single `yarn i18n:ci` owner for lint, the full test suite, manifest, sidecars,
     glossary, terms, provider evidence, prompt-callsite audit, prompt-corpus inventory, and CJK
     scan. Update `.github/workflows/debug.yml` to target `master` and require that quality job;
     update `.github/workflows/release.yml` so packaging depends on the same job.
8. **Fix frontend source, then import it**
   - Web plan Tasks 1–3 land in a companion Toonflow-web PR first. Record the exact upstream
     repository and commit SHA and the SHA-256 of its built `dist/index.html` in a provenance
     manifest.
   - Only after that source commit is reviewable/landed may Web plan Tasks 4–6 import the bundle,
     verify its artifact hash and origin in CI, retain guarded shims, and replace cover art.
9. **Repeat end-to-end QA**
   - Web plan Task 7.
   - Run the same medieval project-to-export flow in English, Vietnamese, and Chinese with a real configured provider.

## Review gates

- Gate 0: never implement or commit on `master`. Create a fresh `codex/...` branch from the latest
  `origin/master`, keep the worktree isolated, and open a PR for review before merge.
- Gate A: approve the prompt invariant and v2 types before any producer writes change.
- Gate B: route-level replay every captured historical `videoDesc` family: marker/pipe `序号N`,
  Markdown rows with leading/trailing pipes, 12-field ideographic-comma single shots, first/last
  free-form text, storyboard-assisted fixed text, and arbitrary manual edits. Compare a legacy and
  V2 record only when generated from the same recoverable normalized data; compare the canonical
  recoverable projection and separately assert documented defaults/loss. Truly unstructured text
  remains read-only `legacy-opaque-single-shot` and never fabricates absent fields.
- Gate C: with explicit provider/credential/spend approval, run and record the protocol comparison for every reference-capable family (Seedance 2.0 and universal multi-reference). The final zero-Chinese prompt guarantee cannot merge/release while any selected syntax remains unverified.
- Gate D: do not enable strict readers until the full required prompt corpus is complete.
- Gate E: do not package a frontend bundle unless every subpatch reports a known old anchor patched,
  a known source-fixed shape verified, or an expected local extension injected. Different subpatches
  may report different allowed states; an unrecognized or contradictory shape within one subpatch fails.
- Gate F: do not claim a final video pass with a no-op provider; QA must use a valid media provider and confirm the exported file is playable.
- Gate G: provider tokens are authorized only by approval-gated harness artifacts whose active
  vendor/model/version/config fingerprint and template/token-builder hashes exactly match runtime.
  Evidence from one family or configured model never authorizes another.
- Gate H: imported web bundles require an exact Toonflow-web repository/commit SHA plus built
  artifact SHA-256; CI rebuilds or otherwise verifies that provenance before packaging.

## Deliverable boundaries

Each task ends in its own focused commit. Do not combine the video data contract, remaining route translations, and frontend bundle work into one pull request. Recommended pull requests:

1. strict prompt/manifest primitives, medieval corpus, and hardcoded route localization;
2. videoDesc v2 compatibility plus the atomic prompt-template/route/seed cutover and verified provider protocol;
3. complete en/vi prompt-corpus cleanup, strict reader adoption, and repository-wide gates;
4. a companion Toonflow-web source localization/layout PR, including its exact source commit and
   built-artifact provenance manifest;
5. backend model-map, provenance-verified imported bundle, guarded compatibility patches, and
   text-free covers, based on PR 4's exact commit.

Recommended branch names:

```text
codex/prompt-locale-foundation
codex/video-prompt-contract-v2
codex/prompt-corpus-zero-han
codex/web-i18n-production-flow
codex/toonflow-web-i18n-production-flow
```

For each PR: create a fresh branch from the latest `origin/master` (or the companion web repository's
default branch), implement only that PR's task set, run its full gates, push, and open the PR. Do not
merge locally, reuse a previously merged branch, or use `master` as a staging branch.
