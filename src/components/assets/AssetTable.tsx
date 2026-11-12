import { DataGrid } from '@cognite/aura/data-grid';
import type { Row } from '@tanstack/react-table';

import {
  ASSET_QUERY_LIMIT,
  ASSET_REGISTER_DESCRIPTION,
  ASSET_SEARCH_TRUNCATED_MESSAGE,
  ASSETS_ERROR_DESCRIPTION,
  ASSETS_ERROR_TITLE,
  ASSETS_LATER_PAGE_ERROR_DESCRIPTION,
} from '../../constants/assets';
import { HudShape } from '../../enums/hudShape';
import { useAssetTableViewModel } from '../../hooks/assets/useAssetTableViewModel';
import { getErrorReason } from '../../lib/errorReason';
import { getInstanceKey } from '../../lib/instanceKey';
import type { AssetListItem } from '../../types/asset';
import {
  CursorPagination,
  GeneralButton,
  HudPanel,
  PageHeader,
  PageShell,
  RetryAlert,
} from '../general';

import { ASSET_COLUMNS } from './AssetColumns';
import { ASSET_GRID_CLASS_NAME } from './assetGridClassName';
import { AssetSearchField } from './AssetSearchField';
import { AssetsKPIs } from './AssetsKPIs';
import { AssetTableEmptyState } from './AssetTableEmptyState';

export function AssetTable() {
  const {
    assets,
    searchQuery,
    isSearching,
    isSearchTruncated,
    pageNumber,
    isOnLaterPage,
    hasNextPage,
    error,
    isError,
    isFetching,
    isPending,
    retry,
    changeSearchQuery,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    openAsset,
  } = useAssetTableViewModel();

  function handleAssetRowClick(row: Row<AssetListItem>): void {
    openAsset(row.original);
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Asset intelligence"
        title="Asset register"
        description={ASSET_REGISTER_DESCRIPTION}
      />

      <AssetsKPIs />

      <HudPanel shape={HudShape.SCREEN} bodyClassName="hud-flush">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-default px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Assets</h2>
            <p className="text-sm text-muted-foreground">Select a row to open the asset.</p>
          </div>
          <div className="w-full sm:w-96">
            <AssetSearchField value={searchQuery} onChange={changeSearchQuery} />
          </div>
        </div>
        {isError ? (
          <div className="flex flex-col items-start gap-3 p-5">
            <div className="w-full">
              <RetryAlert
                title={ASSETS_ERROR_TITLE}
                description={
                  isOnLaterPage ? ASSETS_LATER_PAGE_ERROR_DESCRIPTION : ASSETS_ERROR_DESCRIPTION
                }
                reason={getErrorReason(error)}
                isRetrying={isFetching}
                onRetry={retry}
              />
            </div>
            {isOnLaterPage ? (
              <GeneralButton onClick={goToFirstPage} variant="outline">
                Go to first page
              </GeneralButton>
            ) : null}
          </div>
        ) : (
          <>
            <DataGrid
              aria-label="Assets"
              columns={ASSET_COLUMNS}
              className={ASSET_GRID_CLASS_NAME}
              data={assets}
              emptyState={<AssetTableEmptyState searchQuery={searchQuery} />}
              enableSorting
              emphasizeHeader
              getRowId={getInstanceKey}
              loading={isPending}
              loadingRowCount={ASSET_QUERY_LIMIT}
              onRowClick={handleAssetRowClick}
              size="default"
              wrapCells
            />

            {isSearching ? (
              isSearchTruncated ? (
                <p className="border-t border-default px-5 py-3 text-sm text-muted-foreground">
                  {ASSET_SEARCH_TRUNCATED_MESSAGE}
                </p>
              ) : null
            ) : (
              <CursorPagination
                label="Asset table pagination"
                pageNumber={pageNumber}
                hasPreviousPage={isOnLaterPage}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
              />
            )}
          </>
        )}
      </HudPanel>
    </PageShell>
  );
}
