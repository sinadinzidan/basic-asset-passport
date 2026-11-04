# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. Four should-fix items and eight nice-to-fix items remain open. Once any items you choose to address are done, re-run `flows-code-review`.

### Reviewed commit
`6d043667860b6afee3d026f9f3440603ae752af3`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills`, ran every hunt, applied no fixes. See `review-findings.md`.
- Read `vitest.config.ts` coverage and test config. Nothing under `src/` is excluded from coverage and no tests are excluded from the run.
- Package audit with `npm outdated` and `npm audit`. See `review-packages.md`.
- Lint (`eslint src`) and `tsc --noEmit` both exit 0; `vite build` succeeds.
- File inventory in `review-files.md`.

## Test coverage

Vitest 4.1.10 with v8. 35 test files, 179 tests, all passing.

**Scope:** all `src/**/*.ts(x)` except test files, `*.d.ts` (`vite-env.d.ts`) and `src/main.tsx`.

| Metric | Result |
| ------ | ------ |
| Statements | 98.33% (355/361) |
| Branches | 96.06% (220/229) |
| Functions | 98.54% (135/137) |
| Lines | **98.81% (334/338)** |

The 80% line gate is met at full scope.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 3/5 | Loading, error, empty and success states exist on the register and details screens, and the only effect (`useThemePreference.ts:56`) is safe. No ErrorBoundary (`src/main.tsx:50`), and the topbar logo files are missing (`src/constants/branding.ts:6`). Core flows fail visibly, not silently. |
| User & customer | 1.3 Packages | 3/5 | No critical or high advisories. Four unused production dependencies (`package.json:34-40`), one major behind on React and `@tanstack/react-table`, 18 moderate and 7 low advisories in tooling and Aura's chain. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 98.81% line coverage, no production exclusions, tests run. `LiveAssetDataClientProvider.tsx` and `PageShell.tsx` rely on indirect coverage. |
| User & customer | 1.5 Dead code | 4/5 | No unused source files, no lint or `tsc` errors, no `any`. Stale zod/Motion notes in `vite.config.ts` and `vitest.setup.ts`, and stale README and App-Brief. |
| User & customer | 1.6 Patterns & testability | 4/5 | Hooks take dependencies from React context, the SDK client is injected, mocks are typed, one commented `vi.mock`. Services are plain functions and no hook is named `*ViewModel`. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Both reads use `instances.query` (`assetService.ts:33`, `assetDetailsService.ts:49`). |
| Cognite services | 2.2 Server-side filter | 4/5 | Limits, cursor, projections and the equipment relation filter are in the request. Each call also re-lists views (`viewHelpers.ts:11`). |
| Cognite services | 2.3 Limits & pages | 4/5 | Assets page 10 at a time with a cursor, no prefetch. Equipment is one page of 1000 (`assetDetailsService.ts:80`). |
| Cognite services | 2.4 Call rate | 4/5 | 5 minute stale time and 10 minute gc time, no polling. Extra `views.list` request per query. |
| Cognite services | 2.5 429 backoff | 3/5 | No `QueuedTaskRunner` and no 429 handling; TanStack Query default retries apply (`src/main.tsx:27`). |
| Cognite services | 2.6 CDF Raw | N/A | No Raw usage. |
| Brand | 3.1 Aura | 4/5 | Aura `DataGrid`, tabs, badge, topbar and tokens throughout; isolated custom wrappers in `components/general/`. |

## Must fix

None.

## Should fix

- **No ErrorBoundary** — `src/main.tsx:50`. A render error blanks the whole app; wrap `App` in a boundary with a retry action. (1.1)
- **Missing logo assets** — `src/constants/branding.ts:6`. The two ADNOC SVGs are not in the repo (no `public/`), so the topbar shows a broken image. Add them or change the references. (1.1)
- **No throttling or 429 handling** — `src/main.tsx:27`, `src/services/assets/assetService.ts:33`. Add a concurrency cap and backoff with jitter that respects `Retry-After`. (2.5)
- **Unused production dependencies and tooling advisories** — `package.json:34-40`. Remove `motion`, `pdfjs-dist`, `react-pdf` and `zod`; plan the Vitest, ESLint and Aura upgrades that clear the 18 moderate advisories. (1.3)

## Nice to fix

- Cache the view lookup so each page does not call `views.list` — `src/services/assets/viewHelpers.ts:11`. (2.2, 2.4)
- Page the equipment query instead of one 1000-row request — `src/services/assets/assetDetailsService.ts:80`. (2.3)
- Remove stale zod/PDF handling in `vite.config.ts:31-34,43` and the Motion note at `vitest.setup.ts:4`. (1.5)
- Update `README.md` and `App-Brief.md` to the current register and equipment views. (1.5)
- Add direct tests for `LiveAssetDataClientProvider.tsx` and `PageShell.tsx`. (1.4)
- Take non-critical updates: React 19, `@tanstack/react-table` 9, Aura, `@cognite/sdk` patch, ESLint 10, Vitest 5. (1.3)
- Use stock Aura layout and card pieces in place of `GlassCard`, `StatTile`, `PageShell` where they fit. (3.1)
- Consider interface-based services and `*ViewModel` hook names if reviewers want the `code-quality` form; `PROJECT_CONVENTIONS.md` currently opts out. (1.6)

## Summary

- Must Fix open: 0
- Should Fix open: 4
- Nice Fix open: 8
