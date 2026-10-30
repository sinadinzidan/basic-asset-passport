# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** and **0 should-fix item(s)**. It is round 3 and covers the version without the signals feature (Signals tab, time-series and datapoint queries and `recharts` removed) and with the UI rebuilt from Aura components only (single Aura Topbar, no custom theme stylesheet). Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
Reviewed before the git history was squashed into a single initial commit; the source tree is unchanged by the squash.

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`, the package audit in `review-packages.md` and the file inventory in `review-files.md`. The review skills were pulled from `cognitedata/builder-skills` before scoring and were already current.

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'`. No production file is excluded. 26 test files, 154 tests, all passing. Statements 87.77%, branches 81.73%, functions 92.46%, **lines 89.42%** (≥ 80% gate met). `src/main.tsx` is counted at 0% and still clears the gate.
- **lint / tsc:** 0 errors each. `npm run build` succeeds.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets or `console.log`; CDF traffic goes through the SDK.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` around the dashboard; the asset list, equipment page and file viewer have skeleton or loader loading states, error-with-retry and empty states (Aura `EmptyState`); effects clean up and their cleanup is tested. Links saved with the removed Signals tab fall back to Overview. |
| User & customer | 1.3 Packages | 4/5 | 0 high/critical CVEs. `react-pdf` is one major behind (v11 needs React 19, pinned by the Flows template). Remaining advisories are dev tooling or transitive Aura packages. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 89.42% line coverage over all of `src/`. Files without their own test are types, constants, a barrel, `main.tsx` and the viewer renderers (covered via `CogniteFileViewer.test.tsx`). `useViewport.ts` is at 59%. |
| User & customer | 1.5 Dead code | 4/5 | No unused files; the signals code, the theme stylesheet, the custom empty state and status badge, and `recharts` were removed completely. A few unused exported types in the vendored viewer and four unused dependencies remain. |
| User & customer | 1.6 Patterns & testability | 4/5 | Context-based DI in every hook, ViewModel hooks for the asset list and equipment page, service functions that take the client, and `vi.mock` only for PDF.js. Services are still imported directly as the context defaults. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`; no `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Scope, type, search and relation filters are in the request; search asks for only the matches the page needs. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit. Deeper search pages re-request a larger bounded window (capped at 1000) because `instances.search` has no cursor. |
| Cognite services | 2.4 Call rate | 4/5 | Cached results and search on submit; with signals gone there are no repeated or batched datapoint calls. |
| Cognite services | 2.5 429 backoff | 4/5 | Concurrency cap plus bounded jittered exponential backoff on 429. `Retry-After` is not exposed by the SDK error. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 5/5 | Aura components and tokens only: `Topbar`, `Breadcrumb`, `Tabs`, `SegmentedControl`, `Card`, `Search`, `Pagination`, `Badge`, `Avatar`, `EmptyState`, `Skeleton`, `Dialog`. No theme layer and no raw colours in app code. The one custom element is a token-styled semantic table, because this Aura version has no public table; annotation overlay colours in the vendored viewer are data colours. |

## Must Fix

None open.

## Should Fix

None open.

## Nice Fix

1. Remove unused dependencies `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`.
2. Trim unused exported types in the vendored viewer.
3. Bring `PdfRenderer.tsx` (155) and `DocumentAnnotationOverlay.tsx` (215) under 150 lines.
4. Moderate and low advisories need upstream releases.

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 4
