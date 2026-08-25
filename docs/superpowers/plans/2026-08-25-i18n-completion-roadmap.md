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
   - Model-prompt plan Task 1 and Task 2 Steps 1–3.
   - Establish `tPrompt`, the `sourceLocale` manifest schema, locale-neutral sidecar helpers, and strict generic/skill resolvers before any route adopts them.
2. **Medieval locale corpus**
   - Model-prompt plan Task 7.
   - Keep the 15 canonical medieval files as English, add `.zh.md` sidecars, retain/update `.vi.md`, and remove Chinese style prose from the English/Vietnamese variants.
3. **Prompt guards and localized route shells**
   - Model-prompt plan Task 2 Step 4, followed by Tasks 3–5.
   - Add closed provider-token checks and localize the six known hardcoded route wrappers only after their required corpus is available.
4. **Structured video contract**
   - Video plan Task 1 may land as read-only compatibility by itself. Tasks 2–6 then land atomically in one compatibility release.
   - Add v2 parsing/writes, a canonical JSON envelope, rewritten Seedance/universal/Wan prompts, centralized routes, and quarantined legacy markers/seeds.
5. **Finish the full en/vi prompt corpus**
   - Model-prompt plan Task 7B after the provider protocol gate is verified.
   - Inventory every resolved `data/skills` and `data/modelPrompt` variant, translate all remaining application-authored Han prose, and eliminate the old blanket sidecar budget.
6. **Enable strict model readers everywhere**
   - Model-prompt plan Task 6.
   - Switch agents, model map, and workbench reads only after required locale files exist.
7. **Turn warnings into CI gates**
   - Model-prompt plan Task 8 (building on the Task 2 manifest foundation), Task 9, and Video plan Task 7.
   - Run full manifest, sidecar, glossary, term, CJK, lint, test, and build checks.
8. **Fix and import frontend source**
   - Web plan Tasks 1–6.
   - Land backend model-map contract, upstream Toonflow-web fixes, import the rebuilt bundle, retain guarded shims, and replace cover art.
9. **Repeat end-to-end QA**
   - Web plan Task 7.
   - Run the same medieval project-to-export flow in English, Vietnamese, and Chinese with a real configured provider.

## Review gates

- Gate 0: never implement or commit on `master`. Create a fresh `codex/...` branch from the latest
  `origin/master`, keep the worktree isolated, and open a PR for review before merge.
- Gate A: approve the prompt invariant and v2 types before any producer writes change.
- Gate B: verify a legacy and v2 storyboard build identical JSON request envelopes.
- Gate C: with explicit provider/credential/spend approval, run and record the protocol comparison for every reference-capable family (Seedance 2.0 and universal multi-reference). The final zero-Chinese prompt guarantee cannot merge/release while any selected syntax remains unverified.
- Gate D: do not enable strict readers until the full required prompt corpus is complete.
- Gate E: do not package a frontend bundle unless every subpatch reports a known old anchor patched,
  a known source-fixed shape verified, or an expected local extension injected. Different subpatches
  may report different allowed states; an unrecognized or contradictory shape within one subpatch fails.
- Gate F: do not claim a final video pass with a no-op provider; QA must use a valid media provider and confirm the exported file is playable.

## Deliverable boundaries

Each task ends in its own focused commit. Do not combine the video data contract, remaining route translations, and frontend bundle work into one pull request. Recommended pull requests:

1. strict prompt/manifest primitives, medieval corpus, and hardcoded route localization;
2. videoDesc v2 compatibility plus the atomic prompt-template/route/seed cutover and verified provider protocol;
3. complete en/vi prompt-corpus cleanup, strict reader adoption, and repository-wide gates;
4. backend model-map, imported bundle, guarded compatibility patches, and text-free covers;
5. a companion Toonflow-web source localization/layout PR in that repository.

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
