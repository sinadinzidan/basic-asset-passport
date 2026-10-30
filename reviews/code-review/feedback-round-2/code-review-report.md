# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** and **0 should-fix item(s)**. It is round 2 and follows round 1, whose five Should Fix items were all resolved. Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
Reviewed before the git history was squashed into a single initial commit; the source tree is unchanged by the squash.

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`, the package audit in `review-packages.md` and the file inventory in `review-files.md`.

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'`. No production file is excluded. 35 test files, 202 tests, all passing. Statements 88.88%, branches 82.89%, functions 93.18%, **lines 90.62%** (≥ 80% gate met).
- **lint / tsc:** 0 errors each. `npm run build` succeeds.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets or `console.log`; CDF traffic goes through the SDK.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` around the dashboard; every data surface has loading, error-with-retry and empty states; effects clean up and their cleanup is tested. |
| User & customer | 1.3 Packages | 4/5 | 0 high/critical CVEs. `react-pdf` is one major behind (v11 needs React 19, pinned by the Flows template). Remaining advisories are dev tooling or transitive Aura packages. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 90.62% line coverage over all of `src/`. Files without their own test are types, constants, a barrel, `main.tsx` and the viewer renderers (covered via `CogniteFileViewer.test.tsx`). |
| User & customer | 1.5 Dead code | 4/5 | No unused files. A few unused exported types in the vendored viewer and four unused dependencies remain. |
| User & customer | 1.6 Patterns & testability | 4/5 | Context-based DI in every hook, ViewModel hooks for the asset list, equipment page, live signals and signal dialog, interface-light service functions taking the client, and `vi.mock` only for PDF.js. Services are still imported directly as the context defaults. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Scope, type, search and relation filters are in the request; search asks for only the matches the page needs. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit. Deeper search pages re-request a larger bounded window (capped at 1000) because `instances.search` has no cursor. |
| Cognite services | 2.4 Call rate | 4/5 | Cached results, search on submit, one batched datapoints call per view. |
| Cognite services | 2.5 429 backoff | 4/5 | Concurrency cap plus bounded jittered exponential backoff on 429. `Retry-After` is not exposed by the SDK error. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 4/5 | Aura components throughout; one theme layer remaps Aura tokens; custom segmented controls and tabs are intentional. |

## Must Fix

None open.

## Should Fix

None open. Round 1's five Should Fix items (ViewModels and DI, missing tests, `react-pdf`, oversized viewer, client-side search paging) are resolved.

## Nice Fix

1. Remove unused dependencies `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`.
2. Trim unused exported types in the vendored viewer.
3. Bring `AssetList.tsx`, `PdfRenderer.tsx`, `AssetPassport.tsx` and `DocumentAnnotationOverlay.tsx` under 150 lines.
4. Moderate and low advisories need upstream releases.

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 4
