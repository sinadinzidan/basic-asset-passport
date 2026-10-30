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
| src/components/assets/AssetList.tsx |      161 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/EquipmentPage.tsx |      120 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/FilePreviewDialog.tsx |      119 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/LiveMeasurements.tsx |      120 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/MeasurementChart.tsx |       56 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/SignalDetailDialog.tsx |       94 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/EmptyState.tsx |       21 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/ErrorBoundary.tsx |       39 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/StatusBadge.tsx |       21 | ✓ | ✓ | ✓ | ✓ |  |
| src/constants/assets.ts |       23 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/constants/timeSeries.ts |       29 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/hooks/assets/useAssetList.ts |       78 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useAssetListViewModel.ts |       36 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useEquipmentPageViewModel.ts |       50 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useLiveMeasurementsViewModel.ts |       77 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useMeasurements.ts |       50 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useSignalDetailViewModel.ts |       48 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/appState.ts |       84 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/cdfTaskRunner.ts |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/equipmentPassport.ts |       49 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/measurementFormat.ts |        8 | ✓ | ✓ | ✓ | ✓ |  |
| src/main.tsx |       25 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/pages/dashboard/AssetPassport.tsx |      152 | ✓ | ✓ | ✓ | ✓ |  |
| src/pages/dashboard/Dashboard.tsx |       88 | ✓ | ✓ | ✓ | ✓ |  |
| src/services/assets/assetService.ts |      243 | ✓ | ✓ | ✓ | ✓ |  |
| src/services/assets/timeSeriesService.ts |      169 | ✓ | ✓ | ✓ | ✓ |  |
| src/types/asset.ts |       51 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/types/passport.ts |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| src/types/timeSeries.ts |       41 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vite.config.ts |       31 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.config.ts |       17 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |
| vitest.setup.ts |        4 | ✓ | ✓ | ✓ | ✗ | types / constants / barrel / bootstrap / config |

Test files:       35
