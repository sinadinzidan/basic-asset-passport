# File inventory

Excludes node_modules, dist, .cognite-bundles. Tests = matching `.test` file in the `__tests__/` folder beside the file; "covered" notes name the test that covers a file without its own.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/App.tsx |       64 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/CogniteFileViewer.tsx |       72 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/DefaultStates.tsx |       19 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/DocumentAnnotationOverlay.tsx |      113 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/ImageRenderer.tsx |       95 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/PdfRenderer.tsx |      149 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/TextRenderer.tsx |       21 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/annotationGeometry.ts |       55 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/fileResolution.ts |      133 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/index.ts |       39 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/cognite-file-viewer/mimeTypes.ts |      171 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/types.ts |      192 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/cognite-file-viewer/useBlobUrl.ts |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useDocumentAnnotations.ts |      246 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useFileResolver.ts |      123 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/usePdfPageState.ts |       63 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useTextContent.ts |       35 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useViewport.ts |      283 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetFilesCard.tsx |       59 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/AssetGrid.tsx |       52 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetList.tsx |       81 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/AssetPagination.tsx |       54 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetSearch.tsx |       50 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetTable.tsx |       84 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetViewToggle.tsx |       18 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/EquipmentPage.tsx |       96 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/FilePreviewDialog.tsx |      119 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/AppTopbar.tsx |       42 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/DataTable.tsx |       71 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/ErrorBoundary.tsx |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/IconTile.tsx |       17 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/PageHeader.tsx |       21 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/StateMessage.tsx |       24 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/SurfaceCard.tsx |        7 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/TablePanel.tsx |       22 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/AssetPassport.tsx |      101 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/DocumentsCard.tsx |       57 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/passport/EquipmentSwitcher.tsx |       53 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/KeyFactsCard.tsx |       36 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/NoEquipmentPassport.tsx |       65 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/PassportHero.tsx |       58 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/passport/SpecificationsCard.tsx |       37 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/constants/annotationColors.ts |       34 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/assets.ts |       27 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/fileViewer.ts |       20 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/labels.ts |       16 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/persistence.ts |       20 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/query.ts |        7 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/theme.ts |       18 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/ui.ts |        5 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/assetView.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/fileViewerType.ts |        6 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/passportTab.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/themeMode.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/hooks/assets/useAssetList.ts |       86 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useAssetListViewModel.ts |       38 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useEquipmentPageViewModel.ts |       50 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/theme/useThemeMode.ts |       54 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/appState.ts |       99 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/assetSelection.ts |        5 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/lib/cdfTaskRunner.ts |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/decorative.ts |       32 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/enumGuards.ts |       13 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/equipmentPassport.ts |       50 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/keyFacts.ts |        7 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/motion.ts |       15 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/lib/motionFeatures.ts |        4 | ✓ | ✓ | ✓ | ✗ | lazy-loaded animation features (re-export) |
| src/lib/queryClient.ts |       42 | ✓ | ✓ | ✓ | ✓ |  |
| src/main.tsx |       18 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/pages/dashboard/Dashboard.tsx |       97 | ✓ | ✓ | ✓ | ✓ |  |
| src/services/assets/assetService.ts |      254 | ✓ | ✓ | ✓ | ✓ |  |
| src/types/asset.ts |       44 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/types/passport.ts |       17 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| vite.config.ts |       28 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| vitest.config.ts |       24 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| vitest.setup.ts |       13 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |

Test files:       38
