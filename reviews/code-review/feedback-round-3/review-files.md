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
| src/components/assets/AssetFilesCard.tsx |       49 | ✓ | ✓ | ✓ | ✗ | covered via EquipmentPage.test.tsx |
| src/components/assets/AssetList.tsx |       53 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx and App.test.tsx |
| src/components/assets/AssetPagination.tsx |       39 | ✓ | ✓ | ✓ | ✗ | covered via App.test.tsx |
| src/components/assets/AssetSearch.tsx |       22 | ✓ | ✓ | ✓ | ✗ | covered via App.test.tsx |
| src/components/assets/AssetTable.tsx |       60 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/EquipmentPage.tsx |       82 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/FilePreviewDialog.tsx |      119 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/ErrorBoundary.tsx |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/StateMessage.tsx |       24 | ✓ | ✓ | ✓ | ✗ | covered via AssetList, passport and ErrorBoundary tests |
| src/components/layout/AppTopbar.tsx |       41 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx |
| src/components/layout/PageHeader.tsx |       21 | ✓ | ✓ | ✓ | ✗ | covered via Dashboard.test.tsx and AssetPassport.test.tsx |
| src/constants/assets.ts |       23 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/hooks/assets/useAssetList.ts |       78 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useAssetListViewModel.ts |       36 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useEquipmentPageViewModel.ts |       48 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/useThemeMode.ts |       37 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/appState.ts |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/cdfTaskRunner.ts |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/decorative.ts |       29 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/equipmentPassport.ts |       49 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/motion.ts |       14 | ✓ | ✓ | ✓ | ✗ | covered via AssetTable.test.tsx |
| src/main.tsx |       24 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/pages/dashboard/AssetPassport.tsx |       81 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/Dashboard.tsx |       77 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/DocumentsCard.tsx |       49 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/pages/dashboard/PassportHero.tsx |       55 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/pages/dashboard/SpecificationsCard.tsx |       31 | ✓ | ✓ | ✓ | ✗ | covered via AssetPassport.test.tsx |
| src/services/assets/assetService.ts |      243 | ✓ | ✓ | ✓ | ✓ |  |
| src/types/asset.ts |       51 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/types/passport.ts |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vite.config.ts |       31 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.config.ts |       17 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.setup.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |

Test files:       26
