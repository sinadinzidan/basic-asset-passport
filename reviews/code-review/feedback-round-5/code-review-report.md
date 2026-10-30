# Asset Passport — Flows code review

This document is the platform review for Asset Passport, conducted as part of the Cognite Flows app certification process.

## Path to approval

This review found **0 must-fix item(s)** and **0 should-fix item(s)** open. It is round 5 and covers the project rebuilt on the current Flows template (Aura 1.x, Node 26, npm 12). One Must Fix item (a high advisory in the template's `happy-dom` range) and one Should Fix item (an undeclared `pdfjs-dist` import) were found and fixed during the review and are listed below as resolved. Re-run `flows-code-review` if the code changes materially.

### Reviewed commit
`2870abbf7b25a33c9faa54b1320b6a15c77cf115`

## Checks performed

All hunts in `flows-review-checks` Step 1 were run from the app root; results are in `review-findings.md`, the package audit in `review-packages.md` and the file inventory in `review-files.md`. The review skills were pulled from `cognitedata/builder-skills` before scoring.

- **Coverage scope:** all of `src/**/*.ts(x)` (tests excluded), measured with `--coverage.include='src/**/*.{ts,tsx}'`. No production file is excluded. 38 test files, 227 tests, all passing. Statements 95.68%, branches 87.04%, functions 97.03%, **lines 97.63%** (≥ 80% gate met). `src/main.tsx` is counted at 0% and still clears the gate.
- **lint / tsc:** 0 errors each. `npm run build` succeeds on Node 26.13.0.
- **Security spot checks:** no `dangerouslySetInnerHTML`, `eval`, `innerHTML`, hard-coded secrets or `console.log`; CDF traffic goes through the SDK. `npm audit`: 0 high or critical after the `happy-dom` upgrade.

## Scores

| Area | Criterion | Score | Notes |
| ---- | --------- | ----- | ----- |
| User & customer | 1.1 Known bugs | 4/5 | `ErrorBoundary` around the dashboard; every data surface has skeleton or loader loading, error-with-retry and Aura empty states; effects that subscribe or fetch clean up. The selected equipment, view, page size, search and tab are restored from the shared link. |
| User & customer | 1.3 Packages | 4/5 | 0 high/critical CVEs after upgrading `happy-dom` to 21 (the template range resolved to an affected 20.14.6). `@cognite/aura` is current; React 18 and `react-pdf` 10 are one major behind and pinned by the Flows template (v11 and React 19 go together). Remaining advisories are dev tooling pinned by the template or transitive Aura packages. `pdfjs-dist` is now declared. |
| User & customer | 1.4 Tests & coverage | 4/5 | Honest 97.63% line coverage over all of `src/`, with tests in `__tests__/` folders beside the code. Files without their own test are types, constants, enums, `main.tsx`, the viewer renderers and small presentational components covered through their parents. Wheel zoom, pinch and drag in `useViewport.ts` are now tested (100% lines). |
| User & customer | 1.5 Dead code | 4/5 | No unused files. `clsx` and `tailwind-merge` come with the template but are not imported by the app; a few unused viewer types remain. No component is over 150 lines. |
| User & customer | 1.6 Patterns & testability | 4/5 | Context-based DI in every hook (including the theme storage and media query), ViewModel hooks for the asset list and equipment page, service functions that take the client, hooks ordered per the project conventions, and `vi.mock` only for PDF.js. Services are still imported directly as the context defaults. |
| Cognite services | 2.1 DMS query patterns | 5/5 | Only `instances.query`, `search` and `retrieve`; no `instances.list`. |
| Cognite services | 2.2 Server-side filter | 5/5 | Scope, type, search and relation filters are in the request; search asks for only the matches the page needs. |
| Cognite services | 2.3 Limits & pages | 4/5 | Every query has an explicit limit (10, 25 or 50 assets per page, 25 equipment, 100 files). Deeper search pages re-request a larger bounded window (capped at 1000) because `instances.search` has no cursor. |
| Cognite services | 2.4 Call rate | 4/5 | Cached results and search on submit; no polling. Failed queries retry at most twice and only for transient failures (`src/lib/queryClient.ts`). |
| Cognite services | 2.5 429 backoff | 4/5 | Concurrency cap plus bounded jittered exponential backoff on 429. `Retry-After` is not exposed by the SDK error. |
| Cognite services | 2.6 CDF Raw | N/A | `client.raw` is not used. |
| Brand | 3.1 Aura | 4/5 | Aura components and tokens throughout; the brand colour is set only through token aliases in `src/styles.css`. Run against the per-component imports (the rule only matches the barrel import, so it never fires as configured), Aura's no-overriding-styles rule reported 16 warnings; 7 were fixed by composing Aura components (`InputGroup` for the search field, padding moved into inner elements) and 9 deliberate ones remain (borders on `Card`, `SegmentedControlList` and the dialog header so cards stay distinct, and padding on the full-bleed hero cards). The WCAG-AA fix for muted text is a token alias in `src/styles.css`. the asset table is a custom semantic table (Aura 1.x now ships a virtualised `@cognite/aura/data-grid`; it needs the optional `@tanstack/react-table` and `@tanstack/react-virtual` peers and has not been evaluated for this app), and the vendored viewer keeps inline styles only for values that change at runtime (zoom, pan, size, cursor). |

## Must Fix

None open.

Resolved during this round:
- [x] **`happy-dom` high advisory** (template range `^20.9.0` resolved to 20.14.6, GHSA-834v-8h66-3h79 and GHSA-c8p4-j97h-3vg8) — upgraded to `^21.0.4`. _Impact:_ the test environment could execute code or make server-side requests when parsing untrusted HTML; dev-only, not shipped.

## Should Fix

None open.

Resolved during this round:
- [x] **`pdfjs-dist` imported but not declared** — pinned to `5.4.296`, the version `react-pdf` 10.5.0 uses.

## Nice Fix

1. Remove `clsx` and `tailwind-merge` if the app will never need them (they are template defaults).
2. Report to Aura that `no-overriding-styles` does not match the per-component subpath imports the Flows template uses, so it never fires; 9 deliberate overrides would then show as warnings.
3. Evaluate `@cognite/aura/data-grid` for the asset table (it adds two peer dependencies and virtualisation this app does not need at 10–50 rows).
4. Moderate and low advisories need upstream releases (`vitest` is pinned by the template).

## Summary

- Must Fix open: 0
- Should Fix open: 0
- Nice Fix open: 4
