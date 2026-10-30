# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. Two Must Fix items found during the review (an unused file and a two-majors-behind `motion` dependency) were fixed before this report was written, and are listed below as resolved. Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
Reviewed before the git history was squashed into a single initial commit; the source tree is unchanged by the squash.

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`. The package audit is in `review-packages.md` and the file inventory in `review-files.md`.

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'` because `vitest.config.ts` has no `coverage.include`. No production file is excluded. Result: 26 test files, 162 tests, all passing. Statements 87.45%, branches 82.26%, functions 90.80%, **lines 89.31%** (≥ 80% gate met). `src/main.tsx` is counted at 0% and still clears the gate.
- **lint / tsc:** 0 errors each. `npm run build` succeeds.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets, `localStorage` or `console.log`; CDF traffic goes through the SDK.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` wraps the dashboard; every data surface has loading, error-with-retry and empty states; all effects clean up. Query errors surface in the UI instead of failing silently. |
| User & customer | 1.3 Packages | 3/5 | 0 high/critical CVEs. `react-pdf` is two majors behind (v11 needs React 19, which the Flows template pins); the upgrade plan is documented in `README.md`. Remaining advisories are dev tooling or transitive Aura dependencies. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 89.31% line coverage over all of `src/`. `Dashboard.tsx` and `SignalDetailDialog.tsx` have no colocated test file (covered via `App.test.tsx` and `LiveMeasurements.test.tsx`); `useViewport.ts` is at 59%. |
| User & customer | 1.5 Dead code | 4/5 | Unused `src/lib/utils.ts` removed. A few unused exported types remain in the vendored viewer; four unused dependencies remain in `package.json`. |
| User & customer | 1.6 Patterns & testability | 3/5 | Services take the client as a parameter and tests use a real `CogniteClient` without `vi.mock` (one commented `vi.mock` for PDF.js). There are no ViewModel hooks and no context-based DI; hooks import services and `useCogniteSdk` directly. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`; no `instances.list`. |
| Cognite services | 2.2 Server-side filter | 4/5 | Scope, type, search and relation filters are in the request. Asset search fetches up to 1000 results and paginates in the browser because `instances.search` has no cursor. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit (10 assets, 25 equipment, 100 files, 12 signals, 300 points). No prefetch beyond the page the user opens. |
| Cognite services | 2.4 Call rate | 4/5 | Query results are cached (`staleTime`), search runs on submit instead of per keystroke, and trends are fetched in one batched datapoints call. |
| Cognite services | 2.5 429 backoff | 4/5 | `cdfTaskRunner` caps concurrency at 15 and retries 429 with jittered exponential backoff, bounded to 4 retries. The SDK error does not expose `Retry-After`, so it is not honoured. Three single-shot file-viewer calls are not queued. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 4/5 | Aura components for buttons, inputs, cards, alerts, loaders and dialogs; app theme tokens remap Aura's semantic tokens. Custom segmented controls and tabs are intentional styling. |

## Must Fix

None open.

Resolved during this round:
- [x] **Unused file `src/lib/utils.ts`** (`cn` was imported nowhere) — deleted. _Impact:_ dead code increased the review and bug surface.
- [x] **`motion` two majors behind** (12 vs 14) — upgraded to 14.7.1; type-check, tests and build pass. _Impact:_ an outdated animation dependency in the shipped bundle.

## Should Fix

1. No ViewModel hooks or context-based dependency injection (`src/hooks/assets/useAssetList.ts`, `useMeasurements.ts`) — 1.6.
2. `Dashboard.tsx` and `SignalDetailDialog.tsx` have no colocated test file — 1.4.
3. `react-pdf` two majors behind; upgrade plan in `README.md` — 1.3.
4. `CogniteFileViewer.tsx` (476 lines) mixes fetching with rendering; it is the vendored file viewer — 1.5 / 1.6.
5. Asset search downloads up to 1000 results and paginates client-side (`ASSET_SEARCH_LIMIT`) — 2.2 / 2.3.

## Nice Fix

1. Remove unused dependencies `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`.
2. Trim unused exported types in the vendored viewer.
3. Moderate and low advisories in dev tooling and transitive Aura packages need upstream releases.
4. Raise `useViewport.ts` coverage.

## Summary

- Must Fix open: 0
- Should Fix open: 5
- Nice Fix open: 4
