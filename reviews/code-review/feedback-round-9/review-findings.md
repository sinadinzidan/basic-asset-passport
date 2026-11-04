# Findings: Asset Passport (round 9)

Reviewed commit `6d043667860b6afee3d026f9f3440603ae752af3`. Round 9 checks pulled from `cognitedata/builder-skills` (`flows-review-checks`, `code-quality`) before scoring; no `code-quality` fix was applied and no code was changed.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (provider v8, no `include`, no `all` override). `vite.config.ts` has no `test` block.
- Production paths excluded from coverage: none. Excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`.
- Tests excluded from the test run: none from `src/` (`configDefaults.exclude`, `.claude/**`, `.agents/**`).

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary / componentDidCatch | none. Tree is `QueryClientProvider` → `App` in `src/main.tsx:50-54` |
| TODO / FIXME / HACK / XXX | none |
| `useEffect` | `src/hooks/theme/useThemePreference.ts:56` only; no timers or listeners |
| Loading / error / empty states | `AssetTable.tsx:42,69,118`, `AssetDetailsTabs.tsx:80`, `AssetEquipmentRegister.tsx:35,59,71` |
| coverage/test exclude | none hiding production code or tests |
| CDF Raw | none (2.6 N/A) |
| `instances.list/query/search` | `assetService.ts:33` and `assetDetailsService.ts:49`, both `instances.query` |
| `QueuedTaskRunner` / 429 / backoff | none. `main.tsx:27-34` leaves TanStack Query default retries |
| `any` / `as any` / `as unknown as` | none in production |
| `vi.mock` | `AssetTableSelection.test.tsx:27`, commented (virtualised DataGrid) |
| `createContext` / `useContext` in hooks | `useAssets`, `useAssetEquipmentDetails`, `useAssetNavigation`, `useAssetDataClient`, `useThemePreference` |
| hooks importing deps by `../` | `useAssets.ts:9`, `useAssetEquipmentDetails.ts:10`; both are the context default-deps pattern |
| `new CogniteClient` | `App.tsx:34` (default factory prop), `mocks/cogniteClient.ts:11` (test factory) |
| `class *Service/Client/Repository/Manager` | none (plain service functions, allowed by `PROJECT_CONVENTIONS.md`) |
| pages with `useQuery`/SDK | none |
| `*ViewModel` hooks | none; hooks are named `useAssets` etc. |
| lint / tsc | `eslint src` exit 0; `tsc --noEmit` exit 0; `vite build` succeeds |
| `console.log`/`debug` | none (`console.error` only at `useAssetNavigation.ts:13` as injected default) |
| routes (`path:` / `<Route`) | none (single view, host-synced state) |
| components > 150 lines | none; largest `AssetTable.tsx` 145 |
| unused files | `src/vite-env.d.ts` only (ambient types, expected) |
| unused production dependencies | `motion`, `pdfjs-dist`, `react-pdf`, `zod` (0 imports in `src/`) |
| missing static assets | `/adnoc-horizontal-blue-logo.svg`, `/adnoc-horizontal-white-logo.svg` referenced at `constants/branding.ts:6-7`; no `public/` folder |
| coverage (full `src/`, excluding tests, `*.d.ts`, `main.tsx`) | 35 files, 179 tests passed. Statements 98.33%, branches 96.06%, functions 98.54%, **lines 98.81%** |

## Must / should / nice
- Must Fix: none.
- [ ] Should: no ErrorBoundary, so a render error blanks the whole app — `src/main.tsx:50` — 1.1
- [ ] Should: topbar logos point to two SVG files that are not in the repo, so the live app shows a broken image — `src/constants/branding.ts:6` — 1.1
- [ ] Should: no concurrency cap and no 429/`Retry-After` handling; only TanStack default retries — `src/main.tsx:27`, `src/services/assets/assetService.ts:33` — 2.5
- [ ] Should: four unused production dependencies (`motion`, `pdfjs-dist`, `react-pdf`, `zod`) at `package.json:34-40`; also 18 moderate and 7 low advisories, all in tooling or Aura's chain — 1.3
- [ ] Nice: every service call lists views first, adding a `views.list` request per page — `src/services/assets/viewHelpers.ts:11`, `assetService.ts:21`, `assetDetailsService.ts:31` — 2.2, 2.4
- [ ] Nice: equipment query takes one page of 1000 with no cursor — `src/services/assets/assetDetailsService.ts:80` — 2.3
- [ ] Nice: stale zod and PDF handling in `vite.config.ts:31-34,43`, and a Motion note at `vitest.setup.ts:4` — 1.5
- [ ] Nice: `README.md` and `App-Brief.md` still describe removed features (search, page-size choice) — 1.5
- [ ] Nice: `LiveAssetDataClientProvider.tsx` and `PageShell.tsx` have no direct test file — 1.4
- [ ] Nice: non-critical updates (React 19, `@tanstack/react-table` 9, Aura, `@cognite/sdk` patch, ESLint 10, Vitest 5) — 1.3
- [ ] Nice: custom `GlassCard`, `StatTile`, `PageShell` wrap Aura rather than using a stock Aura card/layout — `src/components/general/` — 3.1
- [ ] Nice: services are plain functions and no hook is named `*ViewModel`; `code-quality` prefers interface services, `PROJECT_CONVENTIONS.md` opts out — `src/services/assets/`, `src/hooks/assets/` — 1.6
