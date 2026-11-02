# File inventory (round 8)

Excludes node_modules, dist, .cognite-bundles. Tests = matching `.test` file in the `__tests__/` folder beside the file; notes name how a file without its own test is covered. Round 8 adds `src/lib/navigation.ts` and `src/hooks/navigation/useAppNavigation.ts` (both with their own tests) and changes `appState.ts`, `assetService.ts`, `Dashboard.tsx` and `vite.config.ts`. Every production file was read again where it changed; the rest are unchanged since round 7.

| File | Lines | Structure | Quality | Patterns | Tests | Notes |
| ---- | ----- | --------- | ------- | -------- | ----- | ----- |
| src/App.tsx |       57 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/CogniteFileViewer.tsx |       73 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/DefaultStates.tsx |       20 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/DocumentAnnotationOverlay.tsx |      114 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/ImageRenderer.tsx |       96 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/PdfRenderer.tsx |      150 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/TextRenderer.tsx |       22 | ✓ | ✓ | ✓ | ✗ | covered via CogniteFileViewer.test.tsx |
| src/cognite-file-viewer/annotationGeometry.ts |       56 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/fileResolution.ts |      134 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/index.ts |       40 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/cognite-file-viewer/mimeTypes.ts |      172 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/types.ts |      193 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/cognite-file-viewer/useBlobUrl.ts |       39 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useDocumentAnnotations.ts |      247 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useFileResolver.ts |      124 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/usePdfPageState.ts |       64 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useTextContent.ts |       36 | ✓ | ✓ | ✓ | ✓ |  |
| src/cognite-file-viewer/useViewport.ts |      284 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetFilesCard.tsx |       35 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/AssetGrid.tsx |       48 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetList.tsx |       80 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/AssetName.tsx |       13 | ✓ | ✓ | ✓ | ✗ | covered by src/components/general/__tests__/sharedParts.test.tsx |
| src/components/assets/AssetPagination.tsx |       54 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetSearch.tsx |       51 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetTable.tsx |       80 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/AssetViewToggle.tsx |       19 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/assets/EquipmentPage.tsx |       86 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/assets/FilePreviewDialog.tsx |      115 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/AppTopbar.tsx |       43 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/DataTable.tsx |       72 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/ErrorBoundary.tsx |       39 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/FileRow.tsx |       35 | ✓ | ✓ | ✓ | ✗ | covered by src/components/general/__tests__/sharedParts.test.tsx |
| src/components/general/FilesCard.tsx |       55 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/general/IconTile.tsx |       18 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/InitialsAvatar.tsx |        9 | ✓ | ✓ | ✓ | ✗ | covered by src/components/general/__tests__/sharedParts.test.tsx |
| src/components/general/LoadingNotice.tsx |       21 | ✓ | ✓ | ✓ | ✗ | covered by src/components/general/__tests__/sharedParts.test.tsx |
| src/components/general/PageHeader.tsx |       22 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/RetryAlert.tsx |       22 | ✓ | ✓ | ✓ | ✗ | covered by src/components/general/__tests__/sharedParts.test.tsx |
| src/components/general/StateMessage.tsx |       25 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/SurfaceCard.tsx |        8 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/general/TablePanel.tsx |       23 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/AssetPassport.tsx |      106 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/DocumentsCard.tsx |       33 | ✓ | ✓ | ✓ | ✓ | covered through its parent component tests |
| src/components/passport/EquipmentSwitcher.tsx |       53 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/KeyFactsCard.tsx |       37 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/NoEquipmentPassport.tsx |       62 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/PassportHero.tsx |       70 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/components/passport/PassportLayout.tsx |       47 | ✓ | ✓ | ✓ | ✓ |  |
| src/components/passport/SpecificationsCard.tsx |       44 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/constants/annotationColors.ts |       35 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/assets.ts |       28 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/fileViewer.ts |       21 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/labels.ts |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/persistence.ts |       21 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/query.ts |        8 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/theme.ts |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/constants/ui.ts |        6 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/assetView.ts |        5 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/fileViewerType.ts |        7 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/passportTab.ts |        5 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/enums/themeMode.ts |        5 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/hooks/assets/useAssetList.ts |       87 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useAssetListViewModel.ts |       39 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/assets/useEquipmentPageViewModel.ts |       51 | ✓ | ✓ | ✓ | ✓ |  |
| src/hooks/navigation/useAppNavigation.ts |       48 | ✓ | ✓ | ✓ | ✓ | new in round 8: takes the host API as an argument, so tests pass a fake |
| src/hooks/theme/useThemeMode.ts |       55 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/appState.ts |       82 | ✓ | ✓ | ✓ | ✓ | now validates the shared link with Zod |
| src/lib/assetSelection.ts |        6 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/lib/cdfTaskRunner.ts |       74 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/decorative.ts |       33 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/enumGuards.ts |       14 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/equipmentPassport.ts |       52 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/fileMeta.ts |       15 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/keyFacts.ts |        8 | ✓ | ✓ | ✓ | ✓ |  |
| src/lib/motion.ts |       16 | ✓ | ✓ | ✓ | ✗ | covered through its parent component tests |
| src/lib/motionFeatures.ts |        5 | ✓ | ✓ | ✓ | ✗ | lazy-loaded animation features (re-export) |
| src/lib/navigation.ts |       67 | ✓ | ✓ | ✓ | ✓ | new in round 8: pure navigation transitions |
| src/lib/queryClient.ts |       43 | ✓ | ✓ | ✓ | ✓ |  |
| src/main.tsx |       19 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/pages/dashboard/Dashboard.tsx |       52 | ✓ | ✓ | ✓ | ✓ | navigation moved into useAppNavigation |
| src/services/assets/assetService.ts |      254 | ✓ | ✓ | ✓ | ✓ | now validates instance properties with Zod |
| src/types/asset.ts |       45 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| src/types/passport.ts |       18 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
| vite.config.ts |       50 | ✓ | ✓ | ✓ | ✗ | adds vendor chunks and a narrow Zod warning filter |
| vitest.config.ts |       25 | ✓ | ✓ | ✓ | ✗ | types / constants / enums / barrel / bootstrap / config |
