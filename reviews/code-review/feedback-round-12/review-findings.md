# Findings: Asset Passport

Reviewed commit `a28c6c14d6e6c47a7359e52a0cd0b05e46d1ff8c`. `flows-review-checks` and `code-quality` were pulled from `cognitedata/builder-skills` with the CLI before this run. No fix from `code-quality` was applied.

## Config inspected

- Coverage config file(s): `vitest.config.ts` (the `vite.config.ts` has no `test` block; no Jest config).
- Production paths excluded from coverage: none. The excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`.
- Tests excluded from the test run: none under `src/` (`test.exclude` adds only `.claude/**` and `.agents/**`).

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx:17`, wraps the app at `src/main.tsx:43` |
| TODO / FIXME / HACK | none |
| `useEffect` | 6 app files (`AgentHelper.tsx`, `useAgentGreeting.ts`, `useScrollToEnd.ts`, `useCopyToClipboard.ts`, `useDebouncedCallback.ts`, `useSpeechDictation.ts`, `useRotatingWord.ts`) and 4 vendored viewer files. Every app effect that starts a timer or a session returns its cleanup. |
| `useQuery` / `useMutation` in `.tsx` | none. 12 `.tsx` files read `isPending` / `isError` flags from hooks. |
| coverage/test exclude | none under `src/` |
| CDF Raw | none |
| instances.list/query/search | `instances.query` in `asset.ts:27`, `assetDetails.ts:15`, `assetEquipment.ts:21`, `notes/assetNote.ts:40`, `timeseries/assetTimeseries.ts:20`, `documents/assetDocument.ts:108`, vendored `useDocumentAnnotations.ts:95`; `instances.search` in `asset.ts:56`; `instances.aggregate` in `nodeCount.ts:13`, `assetsKPICounts.ts:20`. No `instances.list`. |
| QueuedTaskRunner / 429 | `QueuedTaskRunner` and `cdfTaskRunner` in `src/lib/queuedTaskRunner.ts:3`, applied to every client call by `src/lib/limitedCdfClient.ts:11` (cap of 15). 429, 502, 503, 504 retried with jittered exponential backoff (`src/constants/query.ts:6`, `src/lib/queryRetry.ts`). |
| any / vi.mock | no `any`, `as any` or `as unknown as`. One `vi.mock` (`src/components/assets/__tests__/AssetTableSelection.test.tsx:37`, Aura's DataGrid, a third-party module) with a reason above it. |
| lint / tsc | `npm run lint`: 0 errors, 0 warnings. `npx tsc --noEmit`: 0 errors. |
| CogniteClient / DI / ViewModel | `new CogniteClient` only in bootstrap (`src/App.tsx:30`) and a test factory (`src/__mocks__/cogniteClient.ts:8`). 33 hook files use `createContext` / `useContext`. 16 `*ViewModel` hooks. No `class …Service`: services are typed functions injected through per-hook contexts. No `useQuery`, `useMutation` or client call under `src/pages/`. |
| unused files / console.log | No unused production file (the script flags only `src/vite-env.d.ts`). No `console.log` / `console.debug`. No unreachable page: `src/pages/` holds only the two asset pages. |
| routes | none (the app has no router) |
| components > 150 lines | `AssetTable.tsx` 164, `DocumentPreview.tsx` 154, `AgentChat.tsx` 153; none mixes data fetching with rendering. Vendored: `CogniteFileViewer.tsx` 478, `DocumentAnnotationOverlay.tsx` 229. |

## Must / should / nice

### Must fix

None.

### Should fix

- [ ] `react-pdf` is two majors behind (9.2.1, latest 11.0.0); the plan is written down in `README.md` — `package.json` — 1.3
- [ ] The HUD theme restyles Aura components with about 3,470 lines of custom CSS — `src/styles.css` — 3.1

### Nice to fix

- [ ] Services are typed functions, not interface-based — `src/services/assets/` — 1.6
- [ ] Branch coverage at full scope is 76%; the vendored viewer has tests for two of its files only — `src/cognite-file-viewer/` — 1.4
- [ ] "Show more" reads the longer list from the start instead of continuing from a cursor — `src/hooks/general/useListLimit.ts:1` — 2.3
- [ ] A document still processing is re-read every 2 seconds for up to 2 minutes — `src/constants/documents.ts` (`DOCUMENT_PENDING_POLL_MS`) — 2.4
- [ ] `Retry-After` is left to the SDK; the app's own retry does not read it — `src/lib/queryRetry.ts` — 2.5
- [ ] `react`, `react-dom` and `@tanstack/react-table` are one major behind — `package.json` — 1.3
- [ ] `@cognite/app-sdk`, `@cognite/aura` and `@cognite/sdk` have newer minor releases — `package.json` — 1.3
- [ ] Three components are just over 150 lines — `AssetTable.tsx`, `DocumentPreview.tsx`, `AgentChat.tsx` — 1.6
