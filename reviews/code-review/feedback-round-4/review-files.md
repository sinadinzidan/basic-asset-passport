# File inventory

Excludes node_modules, dist, .cognite-bundles. Tests = matching `.test` file in the same folder; "via" notes name the test that covers a file without its own.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/App.tsx |       53 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/CogniteFileViewer.tsx |       70 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/DefaultStates.tsx |       19 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/DocumentAnnotationOverlay.tsx |      214 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/ImageRenderer.tsx |       94 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/PdfRenderer.tsx |      154 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/TextRenderer.tsx |       31 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/fileResolution.ts |      133 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/index.ts |       38 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/cognite-file-viewer/mimeTypes.ts |      171 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/types.ts |      189 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/cognite-file-viewer/useBlobUrl.ts |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useDocumentAnnotations.ts |      232 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useFileResolver.ts |      122 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/usePdfPageState.ts |       62 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useTextContent.ts |       27 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useViewport.ts |      282 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetFilesCard.tsx |       52 | ✓ | ✓ | ✓ | ✗ | covered via EquipmentPage.test.tsx |
| src/components/assets/AssetGrid.tsx |       49 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetList.tsx |       77 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx and App.test.tsx |
| src/components/assets/AssetPagination.tsx |       53 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetSearch.tsx |       43 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetTable.tsx |       83 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetViewToggle.tsx |       16 | ✓ | ✓ | ✓ | ✗ | covered via App.test.tsx |
| src/components/assets/EquipmentPage.tsx |       88 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/FilePreviewDialog.tsx |      119 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/AppTopbar.tsx |       41 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx |
| src/components/general/DataTable.tsx |       69 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/ErrorBoundary.tsx |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/IconTile.tsx |       13 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/components/general/PageHeader.tsx |       21 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx and AssetPassport.test.tsx |
| src/components/general/StateMessage.tsx |       24 | ✓ | ✓ | ✓ | ✗ | covered via App.test.tsx, passport and ErrorBoundary tests |
| src/components/general/SurfaceCard.tsx |        7 | ✓ | ✓ | ✓ | ✗ | covered via the card tests |
| src/components/general/TablePanel.tsx |       22 | ✓ | ✓ | ✓ | ✓ |  |
| src/constants/assets.ts |       24 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/hooks/assets/useAssetList.ts |       78 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useAssetListViewModel.ts |       36 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useEquipmentPageViewModel.ts |       48 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/useThemeMode.ts |       52 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/appState.ts |       83 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/assetSelection.ts |        5 | ✓ | ✓ | ✓ | ✗ |  |
| src/lib/cdfTaskRunner.ts |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/decorative.ts |       29 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/equipmentPassport.ts |       49 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/keyFacts.ts |        7 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/motion.ts |       14 | ✓ | ✓ | ✓ | ✗ | covered via AssetTable.test.tsx |
| src/main.tsx |       24 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/pages/dashboard/AssetPassport.tsx |       94 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/Dashboard.tsx |       94 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/DocumentsCard.tsx |       52 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/pages/dashboard/EquipmentSwitcher.tsx |       48 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/KeyFactsCard.tsx |       33 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/NoEquipmentPassport.tsx |       61 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/PassportHero.tsx |       54 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/pages/dashboard/SpecificationsCard.tsx |       37 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/services/assets/assetService.ts |      243 | ✓ | ✓ | ✓ | ✓ |  |
| src/types/asset.ts |       51 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/types/passport.ts |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vite.config.ts |       31 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.config.ts |       17 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.setup.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |

Test files:       35
