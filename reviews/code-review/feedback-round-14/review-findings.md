# Findings: Asset Passport

Reviewed commit `80f8b47a5b3e0d930510f21878a9255b68fa894a`. `flows-review-checks` and `code-quality` were pulled from `cognitedata/builder-skills` with the CLI before this run (no change from round 13). No fix from `code-quality` was applied.

## Config inspected

- Coverage config file(s): `vitest.config.ts` (the `vite.config.ts` has no `test` block; no Jest config).
- Production paths excluded from coverage: none. The excludes are `node_modules/`, `dist/`, `.claude/`, `.agents/`, `vitest.setup.ts`, `**/*.config.ts`, `**/*.d.ts`.
- Tests excluded from the test run: none under `src/` (`test.exclude` adds only `.claude/**` and `.agents/**`).

## Searches

| Check | Hits (file:line or none) |
| ----- | ------------------------ |
| ErrorBoundary | `src/components/general/ErrorBoundary.tsx`, wraps the app in `src/main.tsx` |
| TODO / FIXME / HACK | none |
| `useEffect` | Unchanged from round 12: 7 app files and the vendored viewer. Every app effect that starts a timer or a session returns its cleanup. |
| `useQuery` / `useMutation` in `.tsx` | none |
| coverage/test exclude | none under `src/` |
| CDF Raw | none |
| instances.list/query/search | `instances.query`, `instances.search` and `instances.aggregate` only, all in `src/services/assets/` and the vendored `useDocumentAnnotations.ts`. No `instances.list`. |
| QueuedTaskRunner / 429 | `QueuedTaskRunner` and `cdfTaskRunner` in `src/lib/queuedTaskRunner.ts`, applied to every client call by `src/lib/limitedCdfClient.ts` (cap of 15). 429, 502, 503, 504 retried with jittered exponential backoff; a `Retry-After` header is honoured (`src/lib/queryRetry.ts`). |
| any / vi.mock | no `any`, `as any` or `as unknown as`. Two `vi.mock`, both of third-party modules the test DOM cannot run and both with a reason above them: Aura's DataGrid (`src/components/assets/__tests__/AssetTableSelection.test.tsx`) and `react-pdf` (`src/cognite-file-viewer/__tests__/CogniteFileViewer.test.tsx`). |
| lint / tsc | `npm run lint`: 0 errors, 0 warnings. `npx tsc --noEmit -p .`: 0 errors. |
| CogniteClient / DI / ViewModel | `new CogniteClient` only in bootstrap (`src/App.tsx`) and a test factory (`src/__mocks__/cogniteClient.ts`). 34 hook files use `createContext` / `useContext`. 16 `*ViewModel` hooks. 14 service files, each an interface implemented by a private class behind a `create<Name>` factory; no class is named outside its file. No `useQuery`, `useMutation` or client call under `src/pages/`. |
| unused files / console.log | none |
| routes | none (the app has no router) |
| components > 150 lines | none in app code (largest: `AssetDocumentItem.tsx` 144). Vendored: `CogniteFileViewer.tsx` 478, `DocumentAnnotationOverlay.tsx` 229. |

## Must / should / nice

### Must fix

None.

### Should fix

- [ ] The HUD theme restyles Aura components with about 3,470 lines of custom CSS; left as it is on the owner's instruction — `src/styles.css` — 3.1

### Nice to fix

- [ ] `react`, `react-dom`, `@tanstack/react-table` and `react-pdf` are one major behind, held by Aura's React 18 peer range; plan in `README.md` — `package.json` — 1.3
