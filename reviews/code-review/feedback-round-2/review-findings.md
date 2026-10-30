# Findings: Asset Passport (round 2)

Changes since round 1: ViewModel hooks and context-based DI, bounded asset search, file viewer split, `react-pdf` 10, new tests for Dashboard, SignalDetailDialog and the ViewModels.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8; measured with `--coverage.include='src/**/*.{ts,tsx}'`)
- Production paths excluded from coverage: none
- Tests excluded from the test run: none (`.claude/**`, `.agents/**` skill folders only)

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx`, used in `src/App.tsx` |
| TODO / FIXME | none |
| useEffect cleanup | effects in `src/cognite-file-viewer/*` all return cleanups (abort, cancelled flag, observer disconnect, listener removal); covered by `useBlobUrl.test.ts`, `useTextContent.test.ts`, `usePdfPageState.test.ts` |
| loading / error / empty states | every `useQuery` surface has loading, error-with-retry and `EmptyState` |
| coverage/test exclude | none under `src/` |
| CDF Raw | none (2.6 N/A) |
| instances.list/query/search | no `list`; `query`, `search`, `retrieve` only |
| QueuedTaskRunner / 429 | `src/lib/cdfTaskRunner.ts` — concurrency 15, 429 retry with jittered exponential backoff, 4 retries; wraps every `instances.*` and `datapoints.*` call. Three single user-triggered file-viewer calls are not queued |
| any / as any / as unknown as | none |
| vi.mock | `CogniteFileViewer.test.tsx:11` only (commented); new tests use context injection |
| createContext in hooks | `useAssetList.ts`, `useMeasurements.ts`, `useAssetListViewModel.ts`, `useEquipmentPageViewModel.ts`, `useLiveMeasurementsViewModel.ts`, `useSignalDetailViewModel.ts` |
| ViewModel hooks | asset list, equipment page, live measurements, signal detail — components only render |
| new CogniteClient | bootstrap default in `src/App.tsx` (injectable via `deps`) |
| unused files / console.log | none |
| components > 150 lines | `DocumentAnnotationOverlay.tsx` 214 (pure rendering, vendored), `AssetList.tsx` 161, `PdfRenderer.tsx` 154, `AssetPassport.tsx` 152 — none mix fetching with rendering |
| lint / tsc | 0 errors each; `npm run build` passes |
| files without a test file | types, constants, barrel, `main.tsx`, and the viewer renderers (covered through `CogniteFileViewer.test.tsx`) |

## Must / should / nice
Round 1 Should Fix items, all resolved:
- [x] No ViewModel hooks / DI context — added (1.6)
- [x] `Dashboard.tsx` and `SignalDetailDialog.tsx` had no tests — added (1.4)
- [x] `react-pdf` two majors behind — upgraded to 10.5.0 (1.3)
- [x] `CogniteFileViewer.tsx` 476 lines mixing fetch and UI — split into 8 files, largest 154 lines (1.5 / 1.6)
- [x] Asset search downloaded 1000 results and paged in the browser — now requests `(page + 1) × 10 + 1` matches (2.2 / 2.3)

### Must fix
None.

### Should fix
None.

### Nice fix
- [ ] Unused dependencies: `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`
- [ ] Unused exported types in the vendored viewer
- [ ] `AssetList.tsx`, `PdfRenderer.tsx`, `AssetPassport.tsx`, `DocumentAnnotationOverlay.tsx` are slightly over 150 lines
- [ ] Moderate and low advisories in dev tooling and transitive Aura packages need upstream releases
- [ ] `react-pdf` 11 and React 19 follow the Flows template
