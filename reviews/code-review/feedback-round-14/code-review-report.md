# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** that block approval. The technical review step is clear; design review round 9 was run alongside this round.

### Reviewed commit

`80f8b47a5b3e0d930510f21878a9255b68fa894a`

## Checks performed

- Pulled `flows-review-checks` and `code-quality` from `cognitedata/builder-skills` with `npx @cognite/cli@latest apps skills pull` before scoring. No `code-quality` fix was applied.
- Re-ran the hunts in `flows-review-checks` Step 1; results are in `review-findings.md`.
- Read `vitest.config.ts` and `vite.config.ts` before trusting any coverage figure.
- Ran `npm run lint` (0 errors, 0 warnings), `npm run format:check`, `npx tsc --noEmit -p .` (0 errors) and `npm run build`.
- Ran `npm outdated --json` and `npm audit --json`; results are in `review-packages.md`.
- Ran `npx vitest run --coverage` at full scope.
- Walked the register, search, the five asset tabs and the assistant panel in mock mode at 1440 px and 390 px: no console error or warning, no horizontal overflow.
- Listed 271 production and config files in `review-files.md`.

## What changed since round 13

No finding of round 13 was open for a code change. Three commits landed since, all from the design review:

| Change | Effect on this review |
| ------ | --------------------- |
| Zoom is no longer disabled in `index.html`; the empty register state sits in a grid cell; the "Open chart" button is named by its content | Accessibility only; tests updated. |
| The Status column header is a plain label (its menu reads "Status options"); the tab reads "Equipment" | Labels only; `SPEC.md` updated. |
| Quiet text in the chart dialog takes the theme's muted ink | Two lines in `src/styles.css`. |

Every check was run again at the commit above rather than carried over.

## Test coverage

Framework: Vitest 4.1.12 with the v8 coverage provider. 248 test files, 2259 tests, all passing, none skipped.

**Scope:** no production path under `src/` is excluded. The run also measures `packages/agent-mascot` and `packages/trend-chart`, which the app imports as source.

| Scope | Lines | Branches |
| ----- | ----- | -------- |
| Full run (`src/` and `packages/`) | 93.5% | 84.9% |
| `src/` only | 98.8% | 94.0% |
| Vendored viewer (`src/cognite-file-viewer/`) | 98.1% | 94.3% |
| `packages/` | 87.0% | 76.5% |

Full-run statements 92.81%, functions 92.32%. Line coverage is above the 80% gate at every scope.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 5/5 | `ErrorBoundary` wraps the app. Every data screen has loading, error with reason and Retry, and empty states. Every effect that starts a timer or a dictation session cleans up. No TODO on any path. |
| User & customer | 1.3 Packages | 4/5 | 0 advisories of any severity. Every package is current within what the platform allows. `react`, `react-dom`, `@tanstack/react-table` and `react-pdf` are one major behind because `@cognite/aura` accepts only React 18; the plan is in `README.md`. This cannot reach 5 until Aura supports React 19. |
| User & customer | 1.4 Tests & coverage | 5/5 | Honest 93.5% line coverage with nothing excluded; 98.8% lines and 94.0% branches for `src/`. Every module with logic, the vendored viewer included, has its own test file. |
| User & customer | 1.5 Dead code | 5/5 | No unreachable page, no unused file, no lint or `tsc` error, no `any`, no commented-out code. |
| User & customer | 1.6 Patterns & testability | 5/5 | Dependencies injected through React context throughout (34 hook files); every service is an interface with a private implementation; 16 ViewModel hooks; no query or client call in pages or `.tsx` files; typed mocks; no app component over 150 lines. The only two `vi.mock` calls replace third-party modules the test DOM cannot run, each with its reason. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Reads use `instances.query`, `instances.search` and `instances.aggregate`. No `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Filters, sort, limits and property projections are all in the request. Counts are server aggregates. The data-model lookup is cached per client. |
| Cognite services | 2.3 Limits & pages | 5/5 | Every list has an explicit limit; the register pages by cursor with no prefetch. See the note below on "Show more". |
| Cognite services | 2.4 Call rate | 5/5 | Search is debounced 300 ms; queries have 30–60 s stale times and are deduplicated. A document still processing is polled at 2, 4, 8, then 16 s as it ages, bounded to 2 minutes. |
| Cognite services | 2.5 429 backoff | 5/5 | `cdfTaskRunner` caps CDF calls at 15 at once. 429, 502, 503 and 504 are retried up to 3 times with jittered exponential backoff capped at 15 s, and a `Retry-After` header sets the delay when present. |
| Cognite services | 2.6 CDF Raw | N/A | Raw is not used. |
| Brand | 3.1 Aura | 3/5 | Unchanged. Every control is an Aura primitive and `aura/no-overriding-styles` reports nothing, but the HUD theme restyles them with about 3,470 lines of custom CSS (`src/styles.css`). Left as it is on the owner's instruction. |

### Note on 2.3

Unchanged from round 13. Round 12 suggested that "Show more" continue from a cursor instead of re-reading a longer list. The notes, documents, equipment and timeseries lists are sorted on the server, and the DMS documentation says cursors cannot be combined with a custom sort unless a cursorable index backs it. Re-reading with a larger limit is therefore the correct pattern for these lists, each read is bounded by an explicit limit, and the suggestion is withdrawn. A Cognite reviewer may still weigh this differently.

## Must fix

None.

## Should fix

1. Bring the theme closer to stock Aura, or have the HUD look accepted as a brand deviation — `src/styles.css` — 3.1. Not acted on by the owner's decision.

## Nice to fix

1. Raise `react`, `react-dom`, `@tanstack/react-table` and `react-pdf` together once `@cognite/aura` accepts React 19 — `package.json` — 1.3.

## Summary

- Must Fix open: 0
- Should Fix open: 1
- Nice Fix open: 1
