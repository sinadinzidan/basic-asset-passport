# File inventory: Asset Passport (round 10)

Reviewed commit `18ecb26e8acbf3a2b1347249941295696fd0558f`. Every `.ts`/`.tsx` outside `node_modules`, `dist` and `.cognite-bundles`. Tests: `✓` direct test, `~` covered through another module's test, `n/a` constants, types or entry file. Production files are read; tests, barrels and `vite-env.d.ts` are not.

## Config

| File | Structure | Quality | Patterns | Tests | Notes |
| ---- | --------- | ------- | -------- | ----- | ----- |
| `vitest.config.ts` | ✓ | ✓ | ✓ | n/a | Coverage excludes only `node_modules`, `dist`, `.claude`, `.agents`, `vitest.setup.ts`, `*.config.ts`, `*.d.ts`. `test.exclude` hides only `.claude/**` and `.agents/**`. |
| `vite.config.ts` | ✓ | ✓ | ✓ | n/a | Zod and PDF special cases removed; only vendor chunking remains. |
| `vitest.setup.ts` | ✓ | ✓ | ✓ | n/a | Happy DOM animation and `localStorage` shims. |

## Source

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| `src/main.tsx` | 54 | ✓ | ✓ | ✓ | n/a | Entry. Theme applied before render. `ErrorBoundary` wraps `App` (line 46). Query client built by `createAppQueryClient`. |
| `src/App.tsx` | 105 | ✓ | ✓ | ✓ | ✓ | Deps via props/default object. `new CogniteClient` at line 34 is the injected default factory. |
| `src/pages/assets/AssetRegister.tsx` | 47 | ✓ | ✓ | ✓ | ✓ | Composition only. |
| `src/pages/assets/AssetEquipmentRegister.tsx` | 110 | ✓ | ✓ | ✓ | ✓ | Pending, error and success states via `LoadingNotice`/`RetryAlert`/tabs. |
| `src/components/assets/AssetTable.tsx` | 145 | ✓ | ✓ | ✓ | ✓ | Under the 150 limit. Loading, error, empty and success handled. |
| `src/components/assets/assetColumns.tsx` | 64 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/assets/AssetDetailsTabs.tsx` | 98 | ✓ | ✓ | ✓ | ✓ | Tabs have an `aria-label`. |
| `src/components/assets/AssetProperties.tsx` | 25 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/assets/EquipmentDetails.tsx` | 34 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/assets/AssetTopbar.tsx` | 86 | ✓ | ✓ | ✓ | ✓ | Uses `AppLogo`; logos exist in `public/`. |
| `src/components/assets/AppLogo.tsx` | 28 | ✓ | ✓ | ✓ | ✓ | Falls back to the app name if the image fails. |
| `src/components/assets/LiveAssetDataClientProvider.tsx` | 21 | ✓ | ✓ | ✓ | ~ | Covered through `App.test.tsx` only. |
| `src/components/general/ErrorBoundary.tsx` | 54 | ✓ | ✓ | ✓ | ✓ | Class component (required by React). Logger injected through `onError`. |
| `src/components/general/CriticalityPill.tsx` | 42 | ✓ | ✓ | ✓ | ✓ | Tone from `lib/assetCriticality.ts`. |
| `src/components/general/CursorPagination.tsx` | 58 | ✓ | ✓ | ✓ | ✓ | Labelled controls. |
| `src/components/general/EmptyStateMessage.tsx` | 31 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/general/GlassCard.tsx` | 7 | ✓ | ✓ | ✓ | ✓ | Custom wrapper. |
| `src/components/general/LoadingNotice.tsx` | 22 | ✓ | ✓ | ✓ | ✓ | Single `role="status"`. |
| `src/components/general/MockModeNotice.tsx` | 11 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/general/PageHeader.tsx` | 30 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/general/PageShell.tsx` | 15 | ✓ | ✓ | ✓ | ~ | Trivial markup. |
| `src/components/general/RetryAlert.tsx` | 33 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/general/StatTile.tsx` | 25 | ✓ | ✓ | ✓ | ✓ | |
| `src/components/general/StatusPill.tsx` | 44 | ✓ | ✓ | ✓ | ✓ | Uses Aura badge. |
| `src/hooks/assets/useAssets.ts` | 35 | ✓ | ✓ | ✓ | ✓ | Context default-deps. Query key includes project and cursor. |
| `src/hooks/assets/useAssetEquipmentDetails.ts` | 41 | ✓ | ✓ | ✓ | ✓ | Context default-deps. |
| `src/hooks/assets/useAssetNavigation.ts` | 63 | ✓ | ✓ | ✓ | ✓ | Host-synced state. `console.error` only as injected default `logError`. |
| `src/hooks/assets/useAssetDataClient.ts` | 19 | ✓ | ✓ | ✓ | ✓ | Throws outside the provider. |
| `src/hooks/general/useCursorPagination.ts` | 26 | ✓ | ✓ | ✓ | ✓ | |
| `src/hooks/theme/useThemePreference.ts` | 62 | ✓ | ✓ | ✓ | ✓ | Single `useEffect`, deps injected, storage guarded. |
| `src/services/assets/assetService.ts` | 75 | ✓ | ✓ | ✓ | ✓ | `instances.query`, limit 10, cursor. |
| `src/services/assets/assetDetailsService.ts` | 170 | ✓ | ✓ | ✓ | ✓ | `instances.query`; equipment limit 1000, no paging. |
| `src/services/assets/viewHelpers.ts` | 42 | ✓ | ✓ | ✓ | ✓ | `views.list` on every service call. |
| `src/lib/assetProperties.ts` | 10 | ✓ | ✓ | ✓ | ✓ | |
| `src/lib/assetCriticality.ts` | 18 | ✓ | ✓ | ✓ | ✓ | |
| `src/lib/queryRetry.ts` | 46 | ✓ | ✓ | ✓ | ✓ | Retry policy for 429/502/503/504 with full-jitter backoff. |
| `src/lib/queryClient.ts` | 18 | ✓ | ✓ | ✓ | ✓ | |
| `src/lib/assetStatus.ts` | 5 | ✓ | ✓ | ✓ | ✓ | |
| `src/lib/navigationState.ts` | 44 | ✓ | ✓ | ✓ | ✓ | Guards instead of casts. |
| `src/lib/utils.ts` | 6 | ✓ | ✓ | ✓ | ✓ | |
| `src/enums/assetEquipmentTab.ts` | 18 | ✓ | ✓ | ✓ | ✓ | UPPER_SNAKE members and values. |
| `src/types/asset.ts` | 40 | ✓ | ✓ | ✓ | n/a | |
| `src/types/assetDataClient.ts` | 16 | ✓ | ✓ | ✓ | n/a | Narrow SDK interface. |
| `src/types/host.ts` | 3 | ✓ | ✓ | ✓ | n/a | |
| `src/constants/assets.ts` | 40 | ✓ | ✓ | ✓ | ✓ | |
| `src/constants/branding.ts` | 10 | ✓ | ✓ | ✓ | n/a | Both referenced SVGs exist in `public/`. |
| `src/constants/env.ts` | 1 | ✓ | ✓ | ✓ | ✓ | `IS_MOCK_MODE`. |
| `src/constants/labels.ts` | 4 | ✓ | ✓ | ✓ | n/a | |
| `src/constants/query.ts` | 2 | ✓ | ✓ | ✓ | n/a | |
| `src/constants/theme.ts` | 2 | ✓ | ✓ | ✓ | n/a | |
| `src/mocks/*.ts(x)` | 493 | ✓ | ✓ | ✓ | ✓ | Dummy data and test factories, separate from services. Dynamic import keeps them out of the normal bundle. |
| `src/styles.css` | 131 | ✓ | ✓ | ✓ | n/a | Not `.ts`; listed for completeness. |

41 test files (218 tests) sit in `__tests__/` folders beside the code.
