# Findings: Asset Passport (round 3)

Review of the version without signals and with the Aura-only UI (before the history was squashed).

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; no `coverage.include`, so measured with `--coverage.include='src/**/*.{ts,tsx}'`)
- Production paths excluded from coverage: none (`node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts` only)
- Tests excluded from the test run: none (`.claude/**` and `.agents/**` skill folders only)

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx` wraps `Dashboard` in `src/App.tsx:46` |
| TODO / FIXME | none |
| useEffect cleanup | 5 files, all in `src/cognite-file-viewer/` (`useBlobUrl`, `usePdfPageState`, `useTextContent`, `useFileResolver`, `useViewport`); each effect returns a cleanup (abort, cancelled flag, observer disconnect or listener removal) |
| loading / error / empty states | `AssetList` and `EquipmentPage` render skeleton loading, error with retry and Aura `EmptyState` (through `StateMessage`); `FilePreviewDialog` and the viewer render loading, error with retry and unsupported states |
| coverage/test exclude | none under `src/` |
| CDF Raw | none (criterion 2.6 is N/A) |
| instances.list/query/search | no `instances.list`; `query`, `search` and `retrieve` only (`assetService.ts:63,74,133,212,230`, `useDocumentAnnotations.ts:98`); the time-series and datapoint calls were removed with the signals feature |
| QueuedTaskRunner / 429 | `src/lib/cdfTaskRunner.ts` (15 concurrent, 429-only retry with jittered exponential backoff, 4 retries); used by every `instances.*` call in `assetService.ts` and `useDocumentAnnotations.ts`. The file viewer's `client.files.retrieve`, `documents.preview` and download-link calls are single user-triggered requests and are not queued |
| any / as any / as unknown as | none |
| vi.mock | `src/cognite-file-viewer/CogniteFileViewer.test.tsx:11` (has a reason comment); the other `vi.mocked` hits are typed mocks of injected context |
| createContext / useContext in hooks | `useAssetList.ts`, `useAssetListViewModel.ts`, `useEquipmentPageViewModel.ts` |
| `../` imports in hooks | `useAssetList.ts:5-7` (constants, services, types), `useAssetListViewModel.ts:3`, `useEquipmentPageViewModel.ts:4-6` (library, types). Services are the context defaults, so they stay replaceable |
| new CogniteClient / DI | only the bootstrap default in `src/App.tsx:24` (injectable through `deps`); tests construct clients |
| pages with useQuery/SDK, no ViewModel | none in `src/pages/`; `AssetList` and `EquipmentPage` consume `useAssetListViewModel` and `useEquipmentPageViewModel` |
| unused files / console.log | none; no `console.log` / `console.debug` |
| hard-coded colours | only the annotation type palette in `DocumentAnnotationOverlay.tsx` (drawing overlay data colours); none in app UI code |
| unused exports | `ResolvedFileConfig`, `ImageMimeType`, `TextMimeType`, `ViewportOptions` (vendored file viewer types) |
| routes | none (single page, state is host-synced) |
| components > 150 lines | `DocumentAnnotationOverlay.tsx` 215, `PdfRenderer.tsx` 155 (`AssetList.tsx` and `AssetPassport.tsx` were split and are under 150) |
| lint / tsc | both clean (0 errors) |
| dangerous DOM APIs / secrets / raw fetch to CDF | none; `fetch` only for the signed download URL in `useBlobUrl.ts` and `useTextContent.ts` |

## Must / should / nice
No Must Fix or Should Fix items.

### Nice fix
- [ ] Unused production dependencies: `clsx`, `tailwind-merge`, `@tanstack/react-table`, `@tanstack/react-virtual` (confirmed with `depcheck`) — 1.5
- [ ] Unused exported types in the vendored viewer (`src/cognite-file-viewer/types.ts`) — 1.5
- [ ] Components slightly over 150 lines: `DocumentAnnotationOverlay.tsx` (215), `PdfRenderer.tsx` (155) — 1.5 / 1.6
- [ ] 4 moderate and 4 low advisories, all dev tooling (`vitest`) or transitive (`@cognite/aura` → mermaid/katex); fixes need breaking changes or an Aura release — 1.3
- [ ] `useViewport.ts` line coverage is 59% — 1.4
