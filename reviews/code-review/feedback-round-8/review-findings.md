# Findings: Asset Passport (round 8)

Re-review at the production-readiness commit (see the report for the full SHA): Zod validation at both trust boundaries, navigation moved into pure transitions plus `useAppNavigation`, vendor chunking, unused dependencies removed, version 1.0.0. Every hunt in `flows-review-checks` Step 1 was run again from the app root on Node 26.13.0; results match round 7 except where noted.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; no `coverage.include`, so measured with `--coverage.include='src/**/*.{ts,tsx}'`)
- Production paths excluded from coverage: none (`node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts` only)
- Tests excluded from the test run: none (`.claude/**` and `.agents/**` skill folders only)

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx` wraps `Dashboard` in `src/App.tsx:45` |
| TODO / FIXME | none |
| useEffect cleanup | `AssetSearch.tsx`, `useThemeMode.ts` and the viewer hooks (`useBlobUrl`, `usePdfPageState`, `useTextContent`, `useFileResolver`, `useViewport`); unchanged since round 7. The new `useAppNavigation.ts` has no effect (state moves are event driven) |
| loading / error / empty states | unchanged: `AssetList`, `EquipmentPage`, `FilePreviewDialog` and the viewer render loading, error with retry and empty states. New: a failed save to the shared link shows `RetryAlert` from `Dashboard.tsx:24` |
| coverage/test exclude | none under `src/` |
| CDF Raw | none (criterion 2.6 is N/A) |
| instances.list/query/search | no `instances.list`; `query`, `search` and `retrieve` only (`assetService.ts:59,70,142,222,240`, `useDocumentAnnotations.ts:98`) |
| QueuedTaskRunner / 429 | `src/lib/cdfTaskRunner.ts` (concurrency cap, 429-only retry with jittered exponential backoff); used by every `instances.*` call; `queryClient.ts` retries only transient failures |
| any / as any / as unknown as | none in production code |
| vi.mock | `src/cognite-file-viewer/__tests__/CogniteFileViewer.test.tsx:12` (PDF.js, has a reason comment); the other hits are `vi.mocked` on injected context |
| createContext / useContext in hooks | `useAssetList.ts`, `useAssetListViewModel.ts`, `useEquipmentPageViewModel.ts`, `useThemeMode.ts`. `useAppNavigation.ts` takes the host API and the initial state as arguments instead, which is as testable (4 tests pass a fake) |
| `../` imports in hooks | constants, services, enums, lib and types only; `useAppNavigation.ts` imports pure `lib` modules |
| new CogniteClient / DI | only the bootstrap default in `src/App.tsx:28` (injectable through `deps`); tests construct clients |
| pages with useQuery/SDK, no ViewModel | none in `src/pages/`; `Dashboard.tsx` uses `useAppNavigation` and makes no CDF calls |
| unused files / console.log | none; no `console.log` / `console.debug` |
| routes | none (single page, state is host-synced) |
| components > 150 lines | none (largest: `PdfRenderer.tsx` at 150; `Dashboard.tsx` is 51 lines, down from the previous version) |
| dangerous DOM APIs / secrets | none (`dangerouslySetInnerHTML`, `eval`, `innerHTML`, `new Function`) |
| trust-boundary validation | new: shared-link state is parsed with Zod in `src/lib/appState.ts` (invalid fields dropped one by one, 15+ tests) and CDF instance properties with Zod in `src/services/assets/assetService.ts` (`parseProperty`), so a malformed link or property cannot reach the UI |
| lint / tsc | both clean (0 errors) |
| bundle | `npm run build` clean with no warnings; main chunk 391 kB (125 kB gzip), `react`, `cognite-sdk` and `data` vendor chunks, viewer chunk lazy (443 kB) |
| undeclared / unused dependencies | `zod` is now declared; `clsx` and `tailwind-merge` were removed (round 7 Nice item) |

## Must / should / nice
- [x] **Resolved in round 8:** `clsx` and `tailwind-merge` removed from `package.json` — 1.5 (round 7 Nice item 1)

### Nice fix
- [ ] `aura/no-overriding-styles` only matches the barrel import, so it never fires with per-component imports; run against them it gave 16 warnings, 7 fixed, 9 deliberate (borders and hero padding) — report upstream — 3.1
- [ ] Aura 1.x ships `@cognite/aura/data-grid` (virtualised table, optional peers `@tanstack/react-table` and `@tanstack/react-virtual`); the app's table is a custom semantic `DataTable` — evaluate only if the lists grow past 50 rows — 3.1
- [ ] 18 moderate advisories in dev tooling (`vitest`, `eslint`, `typescript-eslint`, pinned by the template, none shipped) and 7 low advisories in transitive Aura packages (`mermaid`, `katex`, `@streamdown/*`), all needing upstream releases — 1.3
- [ ] `@cognite/aura` 1.48346 and `motion` 14.9.0 are available; the 1-day release-age rule held them back at install time — update on the next dependency pass — 1.3
