# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. The two blockers of round 11 are resolved; the technical review step is clear and `flows-design-review` is next.

### Reviewed commit

`a28c6c14d6e6c47a7359e52a0cd0b05e46d1ff8c`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring. No `code-quality` fix was applied.
- Re-ran the hunts in `flows-review-checks` Step 1; results are in `review-findings.md`.
- Read `vitest.config.ts` and `vite.config.ts` before trusting any coverage figure.
- Ran `npm run lint` (0 errors, 0 warnings) and `npx tsc --noEmit` (0 errors).
- Package audit carried over from round 11 (`npm outdated --json`, `npm audit --json`); no dependency changed since. Results are in `review-packages.md`.
- Ran `npx vitest run --coverage` at full scope.
- Listed 265 production and config files in `review-files.md`.

## What changed since round 11

| Round 11 item | Resolution |
| ------------- | ---------- |
| Must fix: `src/cognite-file-viewer/` excluded from coverage | Exclusion removed (`vitest.config.ts`); the figures below include the viewer. |
| Must fix: `PageNotFound` and `NoPermission` unreachable | Both pages and their tests deleted. |
| Should fix: no concurrency cap | `QueuedTaskRunner` / `cdfTaskRunner` added (`src/lib/queuedTaskRunner.ts`); the providers wrap the client with `limitCdfCalls`, so every CDF call waits for one of 15 slots. |
| Should fix: no `index.ts` in component directories | Seven barrels added under `src/components/`. |
| Should fix: `react-pdf` two majors behind | Still behind; the reason and upgrade plan are now in `README.md`. |
| Should fix: Aura theme | Unchanged; the HUD look is deliberate. |

## Test coverage

Framework: Vitest 4.1.10 with the v8 coverage provider. 239 test files, 2109 tests, all passing, none skipped.

**Scope:** no production path under `src/` is excluded. The run also measures `packages/agent-mascot` and `packages/trend-chart`, which the app imports as source.

| Statements | Branches | Functions | Lines |
| ---------- | -------- | --------- | ----- |
| 85.78% | 76.01% | 87.70% | 86.58% |

Line coverage is above the 80% gate at full scope.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5/5 | `ErrorBoundary` wraps the app (`src/main.tsx:43`). Every data screen has loading, error with reason and Retry, and empty states. Every effect that starts a timer or a dictation session cleans up. No TODO on any path. |
| User & customer | 1.3 Packages | 3/5 | No high or critical advisory. `react-pdf` is two majors behind (9.2.1 vs 11.0.0), pinned by Cognite's `integrate-file-viewer` skill; the upgrade plan is documented in `README.md`. `react`, `react-dom` and `@tanstack/react-table` are one major behind. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 86.58% line coverage with nothing excluded. Branch coverage is 76%, pulled down by the vendored viewer, which has tests for two of its files. |
| User & customer | 1.5 Dead code | 5/5 | No unreachable page, no unused file, no lint or `tsc` error, no `any`, no commented-out code. Component directories have barrels. |
| User & customer | 1.6 Patterns & testability | 4/5 | Dependencies injected through React context throughout (33 hook files), 16 ViewModel hooks, no query or client call in pages or `.tsx` files, typed mocks, one commented `vi.mock` of a third-party grid. Services are typed functions, not interface-based. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Reads use `instances.query`, `instances.search` and `instances.aggregate`. No `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Asset relation filters, sort, limits and property projections are all in the request (`src/services/assets/assetFilter.ts`, `querySort.ts`). Counts are server aggregates. The data-model lookup is cached per client. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every list has an explicit limit; the register pages by cursor with no prefetch. "Show more" re-reads the longer list from the start rather than continuing from a cursor (`src/hooks/general/useListLimit.ts`). |
| Cognite services | 2.4 Call rate | 4/5 | Search is debounced 300 ms, queries have 30–60 s stale times and are deduplicated by TanStack Query. A document still processing is polled every 2 s, bounded to 2 minutes. |
| Cognite services | 2.5 429 backoff | 4/5 | `cdfTaskRunner` caps CDF calls at 15 at once. 429, 502, 503 and 504 are retried up to 3 times with jittered exponential backoff capped at 15 s (`src/lib/queryRetry.ts`). `Retry-After` is left to the SDK. |
| Cognite services | 2.6 CDF Raw | N/A | Raw is not used. |
| Brand | 3.1 Aura | 3/5 | Every control is an Aura primitive (17 distinct components; no raw `<button>`, `<input>` or `<table>` outside one breadcrumb render prop) and `aura/no-overriding-styles` reports nothing. The HUD theme restyles them with about 3,470 lines of custom CSS (`src/styles.css`), so the app does not look like stock Aura. |

## Must fix

None.

## Should fix

1. Move `react-pdf` to a current major once the `integrate-file-viewer` skill allows it; the plan is in `README.md` — `package.json` — 1.3.
2. Bring the theme closer to stock Aura, or have the HUD look accepted as a brand deviation — `src/styles.css` — 3.1.

## Nice to fix

1. Give the write-heavy services (notes, documents) an interface, which is what the top score for 1.6 asks for — `src/services/assets/notes/assetNote.ts`, `src/services/assets/documents/assetDocument.ts`.
2. Raise branch coverage of the vendored viewer — `src/cognite-file-viewer/` — 1.4.
3. Continue "Show more" from a cursor instead of re-reading the list — `src/hooks/general/useListLimit.ts` — 2.3.
4. Back off the 2-second poll for a processing document — `src/constants/documents.ts` — 2.4.
5. Read `Retry-After` in the app's retry delay — `src/lib/queryRetry.ts` — 2.5.
6. Plan the React 19 and `@tanstack/react-table` 9 upgrades alongside Aura — `package.json` — 1.3.
7. Take the newer `@cognite/app-sdk`, `@cognite/aura` and `@cognite/sdk` minors — `package.json` — 1.3.
8. Trim the three components just over 150 lines — `AssetTable.tsx`, `DocumentPreview.tsx`, `AgentChat.tsx` — 1.6.

## Summary

- Must Fix open: 0
- Should Fix open: 2
- Nice Fix open: 8
