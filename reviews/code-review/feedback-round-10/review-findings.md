# Findings: Asset Passport (round 10)

Reviewed commit `18ecb26e8acbf3a2b1347249941295696fd0558f`. Checks pulled from `cognitedata/builder-skills` (`flows-review-checks`, `code-quality`) at the start of this run; no `code-quality` fix was applied and no code was changed during the review.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (provider v8, no `include`). `vite.config.ts` has no `test` block.
- Production paths excluded from coverage: none. Excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`.
- Tests excluded from the test run: none from `src/` (`configDefaults.exclude`, `.claude/**`, `.agents/**`).

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx:14`, mounted at `src/main.tsx:46` |
| TODO / FIXME / HACK / XXX | none |
| `useEffect` | `src/hooks/theme/useThemePreference.ts:56` only; no timers or listeners |
| Loading / error / empty states | `AssetTable.tsx`, `AssetDetailsTabs.tsx`, `AssetEquipmentRegister.tsx` (pending, error, success) |
| coverage/test exclude | none hiding production code or tests |
| CDF Raw | none (2.6 N/A) |
| `instances.list/query/search` | `assetService.ts:33`, `assetDetailsService.ts:49`; both `instances.query` |
| `QueuedTaskRunner` / 429 / backoff | no `QueuedTaskRunner`. 429 retry with jittered exponential backoff: `src/lib/queryRetry.ts:11-45`, `src/constants/query.ts:6`, wired in `src/lib/queryClient.ts` |
| `any` / `as any` / `as unknown as` | none |
| `vi.mock` | `AssetTableSelection.test.tsx:27`, commented (virtualised DataGrid) |
| `createContext`/`useContext` in hooks | `useAssets`, `useAssetEquipmentDetails`, `useAssetNavigation`, `useAssetDataClient`, `useThemePreference` |
| `new CogniteClient` | `App.tsx:34` (default factory prop), `mocks/cogniteClient.ts:11` |
| `class *Service/Client/Repository/Manager` | none |
| pages with `useQuery`/SDK | none |
| `*ViewModel` hooks | none |
| lint / tsc | `npm run lint` clean; `tsc --noEmit` exit 0; `npm run build` succeeds |
| `console.log`/`debug` | none |
| routes | none (single view, host-synced state) |
| components > 150 lines | none; largest `AssetTable.tsx` 145 |
| unused files | `src/vite-env.d.ts` only (ambient types) |
| unused production dependencies | none. `@tanstack/react-virtual` is not imported but is an Aura peer dependency |
| missing static assets | none; `public/adnoc-horizontal-{blue,white}-logo.svg` exist |
| mock data in production bundle | none: no mock chunk in `dist/`, no dummy dataset strings; `.env` sets `VITE_MOCK_MODE=false` |
| coverage (full `src/`, excluding tests, `*.d.ts`, `main.tsx`) | 41 files, 218 tests passed. Statements 98.73%, branches 96.32%, functions 98.01%, **lines 99.19%** |

## Must / should / nice
- Must Fix: none.
- Should Fix: none.
- [ ] Nice: the only ErrorBoundary is at the root, so a render error replaces the topbar and theme switcher too — `src/main.tsx:46` — 1.1
- [ ] Nice: take non-critical updates: React 19, `@tanstack/react-table` 9, `@cognite/app-sdk` 0.11, ESLint 10, Vitest 5; the 18 moderate and 7 low advisories are in tooling and Aura's chain — `package.json` — 1.3
- [ ] Nice: `LiveAssetDataClientProvider.tsx` and `PageShell.tsx` have no direct test file — 1.4
- [ ] Nice: services are plain functions and no hook is named `*ViewModel`; `PROJECT_CONVENTIONS.md` opts out — `src/services/assets/`, `src/hooks/assets/` — 1.6
- [ ] Nice: every service call lists views first, adding a `views.list` request per page — `src/services/assets/viewHelpers.ts:11`, `assetService.ts:21`, `assetDetailsService.ts:31` — 2.2, 2.4
- [ ] Nice: equipment query takes one page of 1000 with no cursor — `src/services/assets/assetDetailsService.ts:80` — 2.3
- [ ] Nice: retries are capped per query but there is no shared concurrency cap, and `Retry-After` is honoured only inside the SDK — `src/lib/queryRetry.ts` — 2.5
- [ ] Nice: custom `GlassCard`, `StatTile`, `PageShell` wrap Aura rather than using a stock Aura card or layout — `src/components/general/` — 3.1
