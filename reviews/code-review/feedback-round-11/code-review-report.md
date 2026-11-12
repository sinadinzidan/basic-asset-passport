# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **2 must-fix item(s)** that block approval. Once the must-fix items are addressed, re-run `flows-code-review`.

### Reviewed commit

`1c32bf67a88d41f9b969fda84c925b729ea7d260`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring. No `code-quality` fix was applied.
- Ran every hunt in `flows-review-checks` Step 1; results are in `review-findings.md`.
- Read `vitest.config.ts` and `vite.config.ts` before trusting any coverage figure.
- Ran `npm run lint` (0 errors, 0 warnings) and `npx tsc --noEmit` (0 errors).
- Ran `npm outdated --json` and `npm audit --json`; results are in `review-packages.md`.
- Ran `npx vitest run --coverage` twice: as configured, and with the `src/cognite-file-viewer/` exclusion removed.
- Listed 258 production and config files in `review-files.md`.

## Test coverage

Framework: Vitest 4.1.10 with the v8 coverage provider. 239 test files, 2101 tests, all passing, none skipped.

**Scope first:** `vitest.config.ts:26` excludes `src/cognite-file-viewer/` from coverage. That folder is production code (the document viewer), so the configured figure does not count.

| Run | Statements | Branches | Functions | Lines |
| --- | ---------- | -------- | --------- | ----- |
| As configured (viewer excluded) | 92.25% | 83.64% | 92.19% | 92.91% |
| Full scope (viewer included) | 85.81% | 75.98% | 87.93% | 86.59% |

Both runs also measure `packages/agent-mascot` and `packages/trend-chart`, which the app imports as source. At full scope, line coverage is 86.59%, above the 80% gate. The vendored viewer has tests for `DocumentAnnotationOverlay` and `useViewport` only.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5/5 | `ErrorBoundary` wraps the app (`src/main.tsx:43`). Every data screen has loading, error with reason and Retry, and empty states. Every effect that starts a timer or a dictation session cleans up. No TODO on any path. |
| User & customer | 1.3 Packages | 3/5 | No high or critical advisory. `react-pdf` is two majors behind (9.2.1 vs 11.0.0); the pin comes from Cognite's `integrate-file-viewer` skill (`^9.1.1`), but no upgrade plan is written down. `react`, `react-dom` and `@tanstack/react-table` are one major behind. |
| User & customer | 1.4 Tests & coverage | 2/5 | `src/cognite-file-viewer/` is excluded from coverage (`vitest.config.ts:26`), which the rubric scores 1–2 whatever the printed figure. Honest full-scope line coverage is 86.59%, so removing the exclusion is enough. |
| User & customer | 1.5 Dead code | 2/5 | `src/pages/general/PageNotFound.tsx` and `NoPermission.tsx` are rendered nowhere; the rubric treats unreachable pages as blocking. Otherwise lean: no lint or `tsc` errors, no `any`, no unused file, no commented-out code. |
| User & customer | 1.6 Patterns & testability | 4/5 | Dependencies injected through React context throughout (33 hook files), 16 ViewModel hooks, no query or client call in pages or `.tsx` files, typed mocks, one commented `vi.mock` of a third-party grid. Services are typed functions, not interface-based. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Reads use `instances.query`, `instances.search` and `instances.aggregate`. No `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Asset relation filters, sort, limits and property projections are all in the request (`src/services/assets/assetFilter.ts`, `querySort.ts`). Counts are server aggregates. The data-model lookup is cached per client. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every list has an explicit limit; the register pages by cursor with no prefetch. "Show more" re-reads the longer list from the start rather than continuing from a cursor (`src/hooks/general/useListLimit.ts`). |
| Cognite services | 2.4 Call rate | 4/5 | Search is debounced 300 ms, queries have 30–60 s stale times and are deduplicated by TanStack Query. A document still processing is polled every 2 s, bounded to 2 minutes. |
| Cognite services | 2.5 429 backoff | 3/5 | 429, 502, 503 and 504 are retried up to 3 times with jittered exponential backoff capped at 15 s (`src/lib/queryRetry.ts`). There is no `QueuedTaskRunner` or other concurrency cap; opening an asset fires six requests at once. The rubric scores this combination 3. |
| Cognite services | 2.6 CDF Raw | N/A | Raw is not used. |
| Brand | 3.1 Aura | 3/5 | Every control is an Aura primitive (17 distinct components; no raw `<button>`, `<input>` or `<table>` outside one breadcrumb render prop) and `aura/no-overriding-styles` reports nothing. The HUD theme restyles them with about 3,470 lines of custom CSS (`src/styles.css`), so the app does not look like stock Aura. |

## Must fix

1. **Remove `src/cognite-file-viewer/` from `coverage.exclude`** — `vitest.config.ts:26` — criterion 1.4.
   _Impact:_ the reported coverage hides the document viewer, so a regression in the code that shows customers their files could ship while the figure still looks healthy.
2. **Render or remove the unreachable pages** — `src/pages/general/PageNotFound.tsx`, `src/pages/general/NoPermission.tsx` — criterion 1.5.
   _Impact:_ a user without access still gets a generic load error instead of the "No permission" page written for that case, and reviewers must reason about code no user can reach.

## Should fix

1. Write down the `react-pdf` upgrade plan, or move to a current major once the `integrate-file-viewer` skill allows it — `package.json` — 1.3.
2. Put a shared concurrency cap (`QueuedTaskRunner` or equivalent) around CDF calls — `src/lib/queryRetry.ts`, `src/hooks/assets/useAssetDetailsTabCounts.ts:52` — 2.5.
3. Bring the theme closer to stock Aura, or document the HUD look as an approved brand deviation — `src/styles.css` — 3.1.
4. Add an `index.ts` to each component directory, which `code-quality` Step 9 flags as missing — `src/components/agents/`, `src/components/assets/` and its four sub-folders, `src/components/general/` — 1.5.

## Nice to fix

1. Give the write-heavy services (notes, documents) an interface, which is what the top score for 1.6 asks for — `src/services/assets/notes/assetNote.ts`, `src/services/assets/documents/assetDocument.ts`.
2. Continue "Show more" from a cursor instead of re-reading the list — `src/hooks/general/useListLimit.ts` — 2.3.
3. Back off the 2-second poll for a processing document — `src/constants/documents.ts` — 2.4.
4. Plan the React 19 and `@tanstack/react-table` 9 upgrades alongside Aura — `package.json` — 1.3.
5. Take the newer `@cognite/app-sdk`, `@cognite/aura` and `@cognite/sdk` minors — `package.json` — 1.3.
6. Trim the three components just over 150 lines — `AssetTable.tsx`, `DocumentPreview.tsx`, `AgentChat.tsx` — 1.6.

## Summary

- Must Fix open: 2
- Should Fix open: 4
- Nice Fix open: 6
