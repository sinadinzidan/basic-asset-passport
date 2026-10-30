# Findings: Asset Passport

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; no `coverage.include`, so measured with `--coverage.include='src/**/*.{ts,tsx}'`)
- Production paths excluded from coverage: none (`node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts` only)
- Tests excluded from the test run: none (`.claude/**` and `.agents/**` skill folders only)

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx` wraps `Dashboard` in `src/App.tsx` |
| TODO / FIXME | none |
| useEffect cleanup | 8 effects in `src/cognite-file-viewer/*`; each returns a cleanup (abort / cancelled flag / observer disconnect / listener removal) |
| loading / error / empty states | every `useQuery` surface (`AssetList`, `EquipmentPage`, `LiveMeasurements`, `SignalDetailDialog`) renders loading, error with retry, and `EmptyState` |
| coverage/test exclude | none under `src/` |
| CDF Raw | none (criterion 2.6 is N/A) |
| instances.list/query/search | no `instances.list`; `query` / `search` / `retrieve` only (`assetService.ts`, `timeSeriesService.ts`, `useDocumentAnnotations.ts`) |
| QueuedTaskRunner / 429 | `src/lib/cdfTaskRunner.ts` (15 concurrent, 429 retry with jittered exponential backoff, 4 retries); used by every `instances.*` and `datapoints.*` call. `client.files.retrieve`, `documents.preview` and the download-link POST in `src/cognite-file-viewer/` are single user-triggered calls and are not queued |
| any / as any / as unknown as | none |
| vi.mock | `src/cognite-file-viewer/CogniteFileViewer.test.tsx:11` (has a reason comment) |
| createContext / useContext in hooks | none — hooks call `useCogniteSdk()` directly and take the client as a parameter into services |
| `../` imports in hooks | `src/hooks/assets/useAssetList.ts:4-6`, `useMeasurements.ts:4-7` import constants, services and types directly |
| new CogniteClient / DI | only the bootstrap default in `src/App.tsx:23` (injectable through `deps`); tests construct clients |
| pages with useQuery/SDK, no ViewModel | none in `src/pages/`; components call data hooks (`useAssetList`, `useMeasurements`); no `*ViewModel` hooks exist |
| unused files / console.log | none after removing `src/lib/utils.ts`; no `console.log` / `console.debug` |
| unused exports | `ResolvedFileConfig`, `ImageMimeType`, `TextMimeType`, `ViewportOptions` (vendored file viewer types) |
| routes | none (single page, state is host-synced) |
| components > 150 lines | `CogniteFileViewer.tsx` 476, `DocumentAnnotationOverlay.tsx` 214, `AssetList.tsx` 163, `AssetPassport.tsx` 152 |
| lint / tsc | both clean (0 errors) |
| dangerous DOM APIs / secrets / raw fetch to CDF | none; `fetch` only for the signed download URL in `CogniteFileViewer.tsx`; the downloadlink request goes through `client.post` |

## Must / should / nice
- [x] Unused file `src/lib/utils.ts` (`cn` helper imported nowhere) — fixed by deleting it — 1.5
- [x] `motion` two majors behind (12 vs 14) — fixed by upgrading to 14 — 1.3

### Should fix
- [ ] No ViewModel hooks or context-based DI: hooks import services and `useCogniteSdk` directly (`src/hooks/assets/useAssetList.ts:4-6`, `useMeasurements.ts:4-7`). The SDK client is a parameter, so tests need no `vi.mock` — 1.6
- [ ] `Dashboard.tsx` and `SignalDetailDialog.tsx` have no colocated test file (both are covered through `App.test.tsx` and `LiveMeasurements.test.tsx`) — 1.4
- [ ] `react-pdf` is two majors behind (9.2.1 vs 11.0.0); 11 needs React 19. Upgrade plan is recorded in `README.md` — 1.3
- [ ] `CogniteFileViewer.tsx` (476 lines) mixes fetching with UI; it is the vendored viewer — 1.5 / 1.6
- [ ] Asset search downloads up to 1000 results and paginates in the browser (`useAssetList.ts`, `ASSET_SEARCH_LIMIT`); `instances.search` has no cursor — 2.2 / 2.3

### Nice fix
- [ ] Unused production dependencies: `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual`
- [ ] Unused exported types in the vendored viewer
- [ ] 4 moderate and 4 low advisories, all dev tooling (`vitest`) or transitive (`@cognite/aura` → mermaid/katex); fixes need breaking downgrades
- [ ] `useViewport.ts` line coverage is 59%
