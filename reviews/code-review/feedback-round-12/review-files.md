# File inventory: Asset Passport

Reviewed commit `a28c6c14d6e6c47a7359e52a0cd0b05e46d1ff8c`. 265 production and config files, 177 test files (listed by count only). Columns: Structure (path and name follow the layout), Quality (lint, types, no `any`), Patterns (injection, ViewModel, no direct client), Tests (a test file beside it; `n/a` for types, enums, constants, config, barrels, mock data and entry files).

Vendored `src/cognite-file-viewer/` is Cognite's own viewer copied in by the `integrate-file-viewer` skill; it is not linted, so Quality and Patterns are not scored for it.

Production files without a test file of their own: 6 (all in the vendored viewer).

| File | Structure | Quality | Patterns | Tests | Notes |
| ---- | --------- | ------- | -------- | ----- | ----- |
| `src/App.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/__mocks__/CogniteSdkWrapper.tsx` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/QueryClientWrapper.tsx` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/agents.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/assetDetailsTabCounts.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/assets.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/assetsKPICounts.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/cdf.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/cogniteClient.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/documents.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/lists.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/mockAgentContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/mockAssetContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/mockAssetData.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/mockTimeseriesContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/navigation.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/notes.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/__mocks__/themeMode.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/cognite-file-viewer/CogniteFileViewer.tsx` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/DocumentAnnotationOverlay.tsx` | ✓ | – | – | ✓ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/fileResolution.ts` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/index.ts` | ✓ | – | – | n/a | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/mimeTypes.ts` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/types.ts` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/useDocumentAnnotations.ts` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/useFileResolver.ts` | ✓ | – | – | ✗ | Vendored Cognite file viewer; now measured by coverage |
| `src/cognite-file-viewer/useViewport.ts` | ✓ | – | – | ✓ | Vendored Cognite file viewer; now measured by coverage |
| `src/components/agents/AgentChat.tsx` | ✓ | ✓ | ✓ | ✓ | 153 lines |
| `src/components/agents/AgentHelper.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/agents/AgentMessage.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/agents/AgentPanelHeader.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/agents/AgentStatus.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/agents/AgentThinking.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/agents/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/assets/AppLogo.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetColumns.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetDetailsSkeleton.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetDetailsTabs.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetProperties.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetSearchField.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetTable.tsx` | ✓ | ✓ | ✓ | ✓ | 164 lines |
| `src/components/assets/AssetTopbar.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/AssetsKPIs.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/EquipmentDetails.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/AssetDocumentItem.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/AssetDocumentList.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/AssetDocumentUpload.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/AssetDocumentUploadingItem.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/AssetDocuments.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/DocumentPreview.tsx` | ✓ | ✓ | ✓ | ✓ | 154 lines |
| `src/components/assets/documents/DocumentPreviewDialog.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/LinkedAssetPopover.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/documents/documentViewerContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/components/assets/documents/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/assets/equipment/AssetEquipment.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/equipment/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/assets/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/assets/notes/AssetNoteAdd.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/AssetNoteEditForm.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/AssetNoteFields.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/AssetNoteItem.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/AssetNoteList.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/AssetNotes.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/notes/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/assets/timeseries/AssetTimeseries.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/timeseries/TimeseriesChartDialog.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/timeseries/TimeseriesDetails.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/timeseries/TimeseriesPreview.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/assets/timeseries/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/components/general/AppAlert.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/ConfirmDeleteDialog.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/CriticalityPill.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/CursorPagination.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/EmptyStateMessage.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/ErrorBoundary.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/GeneralButton.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/GeneralDialog.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/HudPanel.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/HudVent.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/IconActionButton.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/LoadingNotice.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/MockAppContent.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/MockModeNotice.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/NeonStage.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/PageHeader.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/PageShell.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/RetryAlert.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/ShowMoreButton.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/StatTile.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/StatusPill.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/ThemeModeToggle.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/components/general/index.ts` | ✓ | ✓ | ✓ | n/a | Barrel |
| `src/config/model.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/agents.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/assets.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/branding.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/cdfApi.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/clipboard.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/documents.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/env.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/gridTraces.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/keyboard.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/labels.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/notes.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/number.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/queries.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/query.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/theme.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/time.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/constants/timeseries.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/agentPanelView.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/appAlertVariant.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/assetTab.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/chatMessageRole.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/copyStatus.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/criticalityTone.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/dialogSize.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/dictationFailure.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/documentKind.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/documentOrigin.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/documentUploadStatus.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/gridTraceAxis.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/hudShape.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/hudTone.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/iconActionVariant.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/introPhase.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/loadingNoticeVariant.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/panelPhase.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/statusTone.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/testPropertyType.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/themeMode.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/enums/timeseriesPreviewKind.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/hooks/agents/useAgent.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentChatState.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentChatViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentComposerViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentGreeting.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentHelperViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useAgentStatusViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/agents/useFocusedAgent.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useAssetDocumentListViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useAssetDocumentUploadViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useAssetDocuments.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useAssetLinkedFiles.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useDeleteAssetDocument.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useDocumentFileContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useDocumentPreview.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useLinkedAssetViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useUploadAssetDocuments.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/documents/useUploadingDocumentNames.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/equipment/useAssetEquipment.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/equipment/useAssetEquipmentViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useAddAssetNote.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useAssetNoteAddViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useAssetNoteItemViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useAssetNoteListViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useAssetNotes.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useDeleteAssetNote.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/notes/useUpdateAssetNote.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/timeseries/useAssetTimeseries.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/timeseries/useAssetTimeseriesViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/timeseries/useTimeseriesChartViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/timeseries/useTimeseriesContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/timeseries/useTimeseriesTrends.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetDetails.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetDetailsTabCounts.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetDetailsViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetTableViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssets.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/assets/useAssetsKPICounts.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useCopyToClipboard.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useDebouncedCallback.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useHostConnection.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useListLimit.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useNavigationState.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useRotatingWord.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useScrollToEnd.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useSpeechDictation.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useSuccessToast.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/hooks/general/useThemeModeViewModel.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/appendSpokenText.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/assetCriticality.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/assetMessage.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/assetProperties.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/assetStatus.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/countBadge.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/documentInput.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/documentPolling.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/documentType.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/documentUploadMessage.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/documentUploadStatus.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/errorReason.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/formatNoteDate.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/instanceKey.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/isRecord.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/limitedCdfClient.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/limitedList.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/navigationState.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/noteInput.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/queryClient.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/queryKeys.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/queryRetry.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/queryState.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/queuedTaskRunner.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/startTimeout.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/timeseriesGranularity.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/timeseriesProperties.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/timeseriesTrend.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/lib/utils.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/main.tsx` | ✓ | ✓ | ✓ | n/a |  |
| `src/pages/assets/AssetDetails.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/pages/assets/Assets.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/providers/agents/AgentProvider.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/providers/assets/AssetProvider.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/providers/general/NavigationProvider.tsx` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/agent.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/asset.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/document.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/navigation.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/note.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/text.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/schemas/timeseries.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/agents/agentContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/asset.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/assetDetails.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/assetDetailsTabCounts.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/assetEquipment.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/assetFilter.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/assetsKPICounts.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/documents/assetDocument.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/documents/documentFileContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/instanceDetails.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/nodeCount.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/notes/assetNote.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/querySort.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/timeseries/assetTimeseries.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/timeseries/timeseriesChartAdapter.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/timeseries/timeseriesContext.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/timeseries/timeseriesThresholds.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/assets/viewHelpers.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/speech/browserDictationEngine.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/services/theme/themeModeStore.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/store/agents.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/store/navigation.ts` | ✓ | ✓ | ✓ | ✓ |  |
| `src/types/agent.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/agentChat.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/asset.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/assetContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/countState.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/document.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/documentFileContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/gridTrace.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/host.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/list.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/mockContext.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/navigation.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/note.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/speech.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/theme.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/types/timeseries.ts` | ✓ | ✓ | ✓ | n/a |  |
| `src/vite-env.d.ts` | ✓ | ✓ | ✓ | n/a |  |
| `vite.config.ts` | ✓ | ✓ | ✓ | n/a |  |
| `vitest.config.ts` | ✓ | ✓ | ✓ | n/a |  |
