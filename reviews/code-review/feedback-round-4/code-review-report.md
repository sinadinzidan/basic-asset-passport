# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** and **0 should-fix item(s)**. It is round 4 and covers the current version: no signals, an Aura-only UI branded through token aliases in `src/styles.css`, a list and grid view, and fixes made while auditing the code against `PROJECT_CONVENTIONS.md`. Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
Reviewed before the git history was squashed into a single initial commit; the source tree is unchanged by the squash.

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`, the package audit in `review-packages.md` and the file inventory in `review-files.md`. The review skills were pulled from `cognitedata/builder-skills` before scoring.

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'`. No production file is excluded. 35 test files, 191 tests, all passing. Statements 88.91%, branches 82.93%, functions 93.61%, **lines 90.41%** (≥ 80% gate met). `src/main.tsx` is counted at 0% and still clears the gate.
- **lint / tsc:** 0 errors each. `npm run build` succeeds.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets or `console.log`; CDF traffic goes through the SDK. `npm audit`: 0 high or critical.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` around the dashboard; every data surface has skeleton or loader loading, error-with-retry and Aura empty states; effects that subscribe or fetch clean up. The selected equipment, view, page size, search and tab are restored from the shared link. |
| User & customer | 1.3 Packages | 4/5 | 0 high/critical CVEs. `react-pdf` and React are one major behind (v11 and 19 need React 19, pinned by the Flows template); `@cognite/aura` and `@cognite/app-sdk` follow the template. Remaining advisories are dev tooling or transitive Aura packages. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 90.41% line coverage over all of `src/`. Files without their own test are types, constants, `main.tsx`, the viewer renderers and small presentational components covered through their parents. `useViewport.ts` is at 59%. |
| User & customer | 1.5 Dead code | 4/5 | No unused files. Four unused dependencies (`clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`, which Aura declares as peers) and a few unused viewer types remain. |
| User & customer | 1.6 Patterns & testability | 4/5 | Context-based DI in every hook (including the theme storage and media query), ViewModel hooks for the asset list and equipment page, service functions that take the client, and `vi.mock` only for PDF.js. Services are still imported directly as the context defaults. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`; no `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Scope, type, search and relation filters are in the request; search asks for only the matches the page needs. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit (10, 25 or 50 assets per page, 25 equipment, 100 files). Deeper search pages re-request a larger bounded window (capped at 1000) because `instances.search` has no cursor. |
| Cognite services | 2.4 Call rate | 4/5 | Cached results, search on submit and no polling. |
| Cognite services | 2.5 429 backoff | 4/5 | Concurrency cap plus bounded jittered exponential backoff on 429. `Retry-After` is not exposed by the SDK error. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 4/5 | Aura components and tokens throughout; the brand colour is set only through token aliases in `src/styles.css`. A few token-based utility overrides sit on Aura primitives (`Input`, `Card`, `SegmentedControlList` borders and background), the semantic table is custom because this Aura version has no public table, and the vendored viewer uses inline styles for zoom and position. |

## Must Fix

None open.

## Should Fix

None open.

## Nice Fix

1. Remove the four unused dependencies, or confirm they are Aura peers and document that.
2. Bring `PdfRenderer.tsx` (154) and `DocumentAnnotationOverlay.tsx` (214) under 150 lines and replace the viewer's static inline styles.
3. Make `aura/no-overriding-styles` effective (it ignores per-component subpath imports) and clear what it then reports.
4. Moderate and low advisories need upstream releases.

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 4
