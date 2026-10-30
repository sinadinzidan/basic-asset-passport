# Findings: Asset Passport (round 5)

Review of the project as rebuilt on the current Flows template (Aura 1.x, Node 26, npm 12), at commit `2870abb`.

## Config inspected
- Coverage config file(s): `vitest.config.ts` (v8 provider; no `coverage.include`, so measured with `--coverage.include='src/**/*.{ts,tsx}'`)
- Production paths excluded from coverage: none (`node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts` only)
- Tests excluded from the test run: none (`.claude/**` and `.agents/**` skill folders only)

## Searches
| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx` wraps `Dashboard` in `src/App.tsx` |
| TODO / FIXME | none |
| useEffect cleanup | `AssetSearch.tsx` (removes its key listener), `useThemeMode.ts` (applies the theme), and the viewer hooks (`useBlobUrl`, `usePdfPageState`, `useTextContent`, `useFileResolver`, `useViewport`); every effect with a subscription or async work returns a cleanup |
| loading / error / empty states | `AssetList` and `EquipmentPage` render skeleton loading, error with retry and Aura `EmptyState` (through `StateMessage`); `FilePreviewDialog` and the viewer render loading, error with retry and unsupported states |
| coverage/test exclude | none under `src/` |
| CDF Raw | none (criterion 2.6 is N/A) |
| instances.list/query/search | no `instances.list`; `query`, `search` and `retrieve` only (`assetService.ts`, `useDocumentAnnotations.ts`) |
| QueuedTaskRunner / 429 | `src/lib/cdfTaskRunner.ts` (15 concurrent, 429-only retry with jittered exponential backoff, 4 retries); used by every `instances.*` call. The viewer's single user-triggered file calls are not queued |
| any / as any / as unknown as | none |
| vi.mock | `src/cognite-file-viewer/__tests__/CogniteFileViewer.test.tsx:11` (has a reason comment); other `vi.mocked` hits are typed mocks of injected context |
| createContext / useContext in hooks | `useAssetList.ts`, `useAssetListViewModel.ts`, `useEquipmentPageViewModel.ts`, `useThemeMode.ts` |
| `../` imports in hooks | constants, services, enums, lib and types only; services are the context defaults, so they stay replaceable |
| new CogniteClient / DI | only the bootstrap default in `src/App.tsx:26` (injectable through `deps`); tests construct clients |
| pages with useQuery/SDK, no ViewModel | none in `src/pages/`; `AssetList` and `EquipmentPage` consume ViewModel hooks |
| unused files / console.log | none; no `console.log` / `console.debug` |
| routes | none (single page, state is host-synced) |
| components > 150 lines | none (`DocumentAnnotationOverlay.tsx` was 216, now 113 after moving its palette and geometry into `constants/annotationColors.ts` and `annotationGeometry.ts`) |
| hard-coded colours | only the annotation type palette in `DocumentAnnotationOverlay.tsx` (drawing overlay data colours); brand colour is set through Aura token aliases in `src/styles.css` |
| inline `style` | only values that change at runtime in the vendored viewer (zoom, pan, size, cursor) and its `style` passthrough prop; static ones are utility classes |
| `aura/no-overriding-styles` | configured as `warn` (template default) but inert: a probe file with `<Button className="bg-red-500 rounded-full p-8">` produced no warning, because the rule only tracks imports from the `@cognite/aura/components` barrel and the template asks for per-component subpaths. A manual pass found token-based utility overrides on `Input`, `Card` and `SegmentedControlList` (border, background) |
| undeclared imports (`depcheck`) | `pdfjs-dist` was imported by `PdfRenderer.tsx` but not declared; fixed this round by pinning `pdfjs-dist@5.4.296`, the version `react-pdf` 10.5.0 uses |
| lint / tsc | both clean (0 errors) |
| dangerous DOM APIs / secrets / raw fetch to CDF | none; `fetch` only for the signed download URL in `useBlobUrl.ts` and `useTextContent.ts` |

## Must / should / nice
- [x] **Must Fix, resolved this round:** `happy-dom` `^20.9.0` (the template range) resolved to 20.14.6, which has a high advisory (GHSA-834v-8h66-3h79, GHSA-c8p4-j97h-3vg8; dev test environment only) — upgraded to `^21.0.4` — 1.3
- [x] **Should Fix, resolved this round:** `pdfjs-dist` imported but not declared in `package.json` — pinned `5.4.296` — 1.3 / 1.5

### Nice fix
- [ ] `clsx` and `tailwind-merge` are in the template's dependencies but this app's code does not import them — 1.5
- [ ] `aura/no-overriding-styles` only matches the barrel import, so it never fires with per-component imports; run against them it gave 16 warnings, 7 fixed, 9 deliberate (borders and hero padding) — report upstream — 3.1
- [ ] Aura 1.x ships `@cognite/aura/data-grid` (virtualised table, optional peers `@tanstack/react-table` and `@tanstack/react-virtual`); the app's table is a custom semantic `DataTable`, adopted before the grid existed — evaluate, not required — 3.1
- [ ] 4 moderate advisories in dev tooling (`vitest`, pinned by the template) and 8 low advisories in transitive Aura packages — 1.3
