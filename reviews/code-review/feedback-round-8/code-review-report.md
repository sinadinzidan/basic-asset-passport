# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** and **0 should-fix item(s)** open. It is round 8 and re-checks the project for the 1.0.0 production release: shared-link state and CDF instance properties are now validated with Zod at the two trust boundaries, navigation moved from `Dashboard.tsx` into pure transitions (`src/lib/navigation.ts`) and a `useAppNavigation` hook, vendor code is split into separate chunks, the unused `clsx` and `tailwind-merge` dependencies were removed, and the version is 1.0.0. Nothing new was found. The round 7 Nice item about the unused dependencies is closed. Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
`ba8cfff04d88166993b0349752a619e90bcb5073`

This commit only adds the review artifacts of this round on top; they change no source file.

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`, the package audit in `review-packages.md` and the file inventory in `review-files.md`. `flows-review-checks` and `code-quality` were pulled from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring (no change to the committed copies).

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'`. No production file is excluded. 45 test files, 282 tests, all passing. Statements 96.01%, branches 88.16%, functions 97.36%, **lines 97.82%** (≥ 80% gate met). `src/main.tsx` is counted at 0% and still clears the gate. The new `navigation.ts` has 8 tests and `useAppNavigation.ts` has 4; `appState.ts` and `assetService.ts` gained tests for every dropped or rejected value.
- **lint / tsc:** 0 errors each. `npm run build` succeeds with no warnings. Every command was run on Node 26.13.0, the project's version. `npm ci --dry-run` succeeds against the committed lockfile.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets or `console.log`; CDF traffic goes through the SDK. `npm audit`: 0 high or critical. The production CSP baseline is not extended (`manifest.json` has an empty `permissions.network`), and a real PDF was previewed in Fusion under it.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` around the dashboard; every data surface has loading, error-with-retry and empty states. New: a shared link with a wrong-typed or hand-edited field now loses only that field instead of breaking restore, a malformed CDF property fails with a named error instead of rendering `undefined`, and a failed save to the shared link shows an alert (`Dashboard.tsx:24`). Two quick moves can no longer overwrite each other because every move builds on the latest state. |
| User & customer | 1.3 Packages | 4/5 | 0 high/critical CVEs. `zod` 4.6.7 is current and declared; the unused `clsx` and `tailwind-merge` are gone. `@cognite/aura` and `motion` are a few days behind the newest. React 18 and `react-pdf` 10 are one major behind and pinned together by the Flows template. Remaining advisories are dev tooling pinned by the template or transitive Aura packages. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 97.82% line coverage over all of `src/`, with tests in `__tests__/` folders beside the code. The new modules are tested directly, including the paths that drop invalid data. Files without their own test are types, constants, enums, `main.tsx`, the viewer renderers and small presentational components covered through their parents. |
| User & customer | 1.5 Dead code | 4/5 | No unused files. The navigation rules moved out of a 90-line component into 66 lines of pure functions plus a 47-line hook, and `Dashboard.tsx` is now 51 lines. The unused dependencies are removed. A few unused viewer types remain. No component is over 150 lines. |
| User & customer | 1.6 Patterns & testability | 4/5 | Context-based DI in every data hook, ViewModel hooks for the asset list and equipment page, service functions that take the client, and `vi.mock` only for PDF.js. `useAppNavigation` takes the host API as an argument instead of reading a context, which keeps it testable without mocks. Services are still imported directly as the context defaults. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`; no `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Scope, type, search and relation filters are in the request; search asks for only the matches the page needs. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit (10, 25 or 50 assets per page, 25 equipment, 100 files). Deeper search pages re-request a larger bounded window (capped at 1000) because `instances.search` has no cursor. |
| Cognite services | 2.4 Call rate | 4/5 | Cached results and search on submit; no polling. Failed queries retry at most twice and only for transient failures (`src/lib/queryClient.ts`). |
| Cognite services | 2.5 429 backoff | 4/5 | Concurrency cap plus bounded jittered exponential backoff on 429. `Retry-After` is not exposed by the SDK error. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 4/5 | Aura components and tokens throughout; the brand colour is set only through token aliases in `src/styles.css`. Aura's no-overriding-styles rule never fires with the per-component imports the template uses; run against them it reported 16 warnings in round 7, 7 fixed and 9 deliberate (borders on cards and dialog header, hero padding). The asset table is a custom semantic table (`@cognite/aura/data-grid` has not been evaluated; it adds two peer dependencies and virtualisation this app does not need at 10–50 rows). |

## Must Fix

None open.

Resolved in round 5 and still fixed:
- [x] **`happy-dom` high advisory** (template range `^20.9.0` resolved to 20.14.6, GHSA-834v-8h66-3h79 and GHSA-c8p4-j97h-3vg8) — upgraded to `^21.0.4`. _Impact:_ the test environment could execute code or make server-side requests when parsing untrusted HTML; dev-only, not shipped.

## Should Fix

None open.

Resolved in round 5 and still fixed:
- [x] **`pdfjs-dist` imported but not declared** — pinned to `5.4.296`, the version `react-pdf` 10.5.0 uses.

## Nice Fix

1. Report to Aura that `no-overriding-styles` does not match the per-component subpath imports the Flows template uses, so it never fires; 9 deliberate overrides would then show as warnings.
2. Evaluate `@cognite/aura/data-grid` for the asset table if the lists grow past 50 rows.
3. Moderate and low advisories need upstream releases (`vitest`, `eslint` and `typescript-eslint` are pinned by the template; Aura's `mermaid` and `katex` are transitive).
4. Update `@cognite/aura` to 1.48346 and `motion` to 14.9.0 on the next dependency pass.

Resolved in round 8:
- [x] `clsx` and `tailwind-merge` removed (round 7 Nice item 1).

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 4
