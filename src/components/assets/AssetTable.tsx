import { DataGrid } from '@cognite/aura/data-grid';
import { IconCircleCheck, IconCircleDashed } from '@tabler/icons-react';
import type { Row } from '@tanstack/react-table';

import { ASSET_QUERY_LIMIT, ASSET_SEARCH_LIMIT } from '../../constants/assets';
import { PENDING_COUNT_LABEL } from '../../constants/labels';
import { useAssets } from '../../hooks/assets/useAssets';
import { useCursorPagination } from '../../hooks/general/useCursorPagination';
import { isOperatingStatus } from '../../lib/assetStatus';
import type { AssetIdentifier, AssetListItem } from '../../types/asset';
import { CursorPagination } from '../general/CursorPagination';
import { EmptyStateMessage } from '../general/EmptyStateMessage';
import { HudPanel } from '../general/HudPanel';
import { PageHeader } from '../general/PageHeader';
import { PageShell } from '../general/PageShell';
import { RetryAlert } from '../general/RetryAlert';
import { StatTile } from '../general/StatTile';

import { ASSET_COLUMNS } from './assetColumns';
import { AssetSearchField } from './AssetSearchField';

type AssetTableProps = {
  onAssetSelect: (assetIdentifier: AssetIdentifier) => void;
  /** The search the register is filtered by; empty lists every asset. */
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
};

const ASSET_GRID_CLASS_NAME = [
  'rounded-none bg-transparent',
  "[&_[data-slot='data-grid-header-row']]:border-t-0",
  "[&_[data-slot='data-grid-header-row']]:bg-muted-background/60",
  "[&_[data-slot='data-grid-row']]:cursor-pointer",
  "[&_[data-slot='data-grid-row']]:bg-transparent",
  "[&_[data-slot='data-grid-row']]:transition-colors",
  "[&_[data-slot='data-grid-column-header']:hover]:bg-brand/10",
  "[&_[data-slot='data-grid-row']:hover]:bg-brand/10",
  "[&_[data-slot='data-grid-header-row']_[aria-colindex='5']]:justify-center",
  "[&_[data-slot='data-grid-header-row']_[aria-colindex='5']]:text-center",
].join(' ');

export function AssetTable({
  onAssetSelect,
  searchQuery,
  onSearchChange,
}: AssetTableProps) {
  const pagination = useCursorPagination();
  const {
    data: assetPage,
    isError,
    isFetching,
    refetch,
  } = useAssets(pagination.cursor, searchQuery);
  const isSearching = searchQuery !== '';

  const assets = assetPage?.items ?? [];
  const nextCursor = assetPage?.nextCursor ?? null;
  const operatingCount = assets.filter((asset) =>
    isOperatingStatus(asset.flocStatus),
  ).length;
  const otherStatusCount = assets.length - operatingCount;
  const isSearchTruncated = isSearching && assets.length >= ASSET_SEARCH_LIMIT;

  function handleRetry(): void {
    void refetch();
  }

  function handleNextPage(): void {
    if (nextCursor) pagination.goToNextPage(nextCursor);
  }

  function handleSearchChange(nextSearchQuery: string): void {
    // The pages of one search are not the pages of another.
    pagination.reset();
    onSearchChange(nextSearchQuery);
  }

  function handleAssetRowClick(row: Row<AssetListItem>): void {
    onAssetSelect({
      space: row.original.space,
      externalId: row.original.externalId,
    });
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Asset intelligence"
        title="Asset register"
        description="Browse functional locations and open an asset to review its properties and linked equipment."
      />

      <section
        aria-label="Current page summary"
        className="grid gap-4 sm:grid-cols-2"
      >
        <StatTile
          label="Operating"
          value={assetPage ? operatingCount : PENDING_COUNT_LABEL}
          icon={<IconCircleCheck className="size-6" />}
        />
        <StatTile
          label="Other statuses"
          value={assetPage ? otherStatusCount : PENDING_COUNT_LABEL}
          icon={<IconCircleDashed className="size-6" />}
        />
      </section>

      <HudPanel bodyClassName="hud-flush">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-default px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Assets</h2>
            <p className="text-sm text-muted-foreground">
              Select a row to open the asset.
            </p>
          </div>
          <div className="w-full sm:w-96">
            <AssetSearchField
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        {isError ? (
          <div className="p-5">
            <RetryAlert
              title="Assets could not be loaded"
              description="Check access to the Asset view, then try again."
              isRetrying={isFetching}
              onRetry={handleRetry}
            />
          </div>
        ) : (
          <>
            <DataGrid
              aria-label="Assets"
              columns={ASSET_COLUMNS}
              className={ASSET_GRID_CLASS_NAME}
              data={assets}
              emptyState={
                isSearching ? (
                  <EmptyStateMessage
                    title="No matching assets"
                    description={`No asset matches "${searchQuery}". Try a different name, description or plant.`}
                  />
                ) : (
                  <EmptyStateMessage
                    title="No assets found"
                    description="The Asset view returned no instances."
                  />
                )
              }
              enableSorting
              emphasizeHeader
              getRowId={(asset) => `${asset.space}:${asset.externalId}`}
              loading={isFetching}
              loadingRowCount={ASSET_QUERY_LIMIT}
              onRowClick={handleAssetRowClick}
              size="default"
              wrapCells
            />

            {isSearching ? (
              isSearchTruncated ? (
                <p className="border-t border-default px-5 py-3 text-sm text-muted-foreground">
                  {`Showing the first ${ASSET_SEARCH_LIMIT} matches. Refine the search to narrow them.`}
                </p>
              ) : null
            ) : (
              <CursorPagination
                label="Asset table pagination"
                pageNumber={pagination.pageNumber}
                hasPreviousPage={pagination.hasPreviousPage}
                hasNextPage={nextCursor !== null}
                isFetching={isFetching}
                onPreviousPage={pagination.goToPreviousPage}
                onNextPage={handleNextPage}
              />
            )}
          </>
        )}
      </HudPanel>
    </PageShell>
  );
}
