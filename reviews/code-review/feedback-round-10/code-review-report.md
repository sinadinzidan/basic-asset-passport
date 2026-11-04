# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval, and no should-fix items. Eight nice-to-fix items remain open. The four should-fix items from round 9 are resolved.

### Reviewed commit
`18ecb26e8acbf3a2b1347249941295696fd0558f`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills`, ran every hunt, applied no fixes. See `review-findings.md`.
- Read `vitest.config.ts` coverage and test config. Nothing under `src/` is excluded from coverage and no tests are excluded from the run.
- Package audit with `npm outdated` and `npm audit`. See `review-packages.md`.
- `npm run lint`, `tsc --noEmit` and `npm run build` all pass; `npm audit --audit-level=high` exits 0.
- Production bundle checked for mock data: none present with `VITE_MOCK_MODE=false`.
- File inventory in `review-files.md`.

## Test coverage

Vitest 4.1.10 with v8. 41 test files, 218 tests, all passing.

**Scope:** all `src/**/*.ts(x)` except test files, `*.d.ts` (`vite-env.d.ts`) and `src/main.tsx`.

| Metric | Result |
| ------ | ------ |
| Statements | 98.73% (391/396) |
| Branches | 96.32% (236/245) |
| Functions | 98.01% (148/151) |
| Lines | **99.19% (370/373)** |

The 80% line gate is met at full scope.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | Loading, error, empty and success states on every data screen. `ErrorBoundary` now wraps the app (`src/main.tsx:46`) and the logos exist in `public/`. The boundary is root-only. |
| User & customer | 1.3 Packages | 4/5 | No critical or high advisories; unused dependencies removed; Aura, SDK and React Query current. React and `@tanstack/react-table` are one major behind (held by Aura); 18 moderate advisories sit in tooling and Aura's chain. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 99.19% line coverage, no production exclusions. `LiveAssetDataClientProvider.tsx` and `PageShell.tsx` rely on indirect coverage. |
| User & customer | 1.5 Dead code | 5/5 | No unused source files or dependencies, no lint or `tsc` errors, no `any`, docs match the app. |
| User & customer | 1.6 Patterns & testability | 4/5 | Hooks take dependencies from React context, SDK client injected, typed mocks, one commented `vi.mock`. Services are plain functions and no hook is named `*ViewModel`. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Both reads use `instances.query`. |
| Cognite services | 2.2 Server-side filter | 4/5 | Limits, cursor, projections and the equipment relation are in the request. Each call also re-lists views (`viewHelpers.ts:11`). |
| Cognite services | 2.3 Limits & pages | 4/5 | Assets page 10 at a time with a cursor, no prefetch. Equipment is one page of 1000 (`assetDetailsService.ts:80`). |
| Cognite services | 2.4 Call rate | 4/5 | 5 minute stale time, no polling. Extra `views.list` request per query. |
| Cognite services | 2.5 429 backoff | 4/5 | 429/502/503/504 retried up to 3 times with full-jitter exponential backoff capped at 15 s (`src/lib/queryRetry.ts`). No shared concurrency cap; `Retry-After` is handled inside the SDK. |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura `DataGrid`, tabs, badges, topbar and tokens throughout; isolated custom wrappers in `components/general/`. |

## Must fix

None.

## Should fix

None.

## Nice to fix

- Add a second, page-level error boundary so the topbar survives a render error — `src/main.tsx:46`. (1.1)
- Take non-critical updates: React 19, `@tanstack/react-table` 9, `@cognite/app-sdk` 0.11, ESLint 10, Vitest 5. (1.3)
- Add direct tests for `LiveAssetDataClientProvider.tsx` and `PageShell.tsx`. (1.4)
- Consider interface-based services and `*ViewModel` hook names; `PROJECT_CONVENTIONS.md` currently opts out. (1.6)
- Cache the view lookup so each page does not call `views.list` — `src/services/assets/viewHelpers.ts:11`. (2.2, 2.4)
- Page the equipment query instead of one 1000-row request — `src/services/assets/assetDetailsService.ts:80`. (2.3)
- Add a shared concurrency cap around CDF calls — `src/lib/queryRetry.ts`. (2.5)
- Use stock Aura layout and card pieces in place of `GlassCard`, `StatTile`, `PageShell` where they fit. (3.1)

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 8
