import { Button } from '@cognite/aura/components/button';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconDatabase } from '@tabler/icons-react';

import { ASSET_LIST_SKELETON_ROW_COUNT, ASSET_PAGE_SIZE, ASSET_SEARCH_LIMIT, ASSET_VIEW } from '../../constants/assets';
import { AssetView } from '../../enums/assetView';
import { useAssetListViewModel } from '../../hooks/assets/useAssetListViewModel';
import type { AssetSelection } from '../../types/asset';
import { PageHeader } from '../general/PageHeader';
import { RetryAlert } from '../general/RetryAlert';
import { StateMessage } from '../general/StateMessage';
import { TablePanel } from '../general/TablePanel';

import { AssetGrid } from './AssetGrid';
import { AssetPagination } from './AssetPagination';
import { AssetSearch } from './AssetSearch';
import { AssetTable } from './AssetTable';
import { AssetViewToggle } from './AssetViewToggle';

export function AssetList({ page, pageSize = ASSET_PAGE_SIZE, view = AssetView.LIST, onViewChange, search = '', onSearchChange, onPageChange, onPageSizeChange, onAssetSelect }: {
  page: number;
  view?: AssetView;
  onViewChange: (view: AssetView) => void;
  pageSize?: number;
  search?: string;
  onSearchChange?: (search: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onAssetSelect: (asset: AssetSelection) => void;
}) {
  const { assets, isLoading, isFetching, errorMessage, hasNextPage, isSearchLimited, hasNoMatches, retry } = useAssetListViewModel(page, search, pageSize);

  const body = isLoading ? (
    <div role="status" aria-label="Loading assets" className="space-y-2 p-4">
      {Array.from({ length: ASSET_LIST_SKELETON_ROW_COUNT }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
    </div>
  ) : errorMessage ? (
    <div className="p-4">
      <RetryAlert message={`Failed to load assets: ${errorMessage}`} onRetry={retry} isBusy={isFetching}>
        {page > 0 && <Button variant="secondary" onClick={() => onPageChange(0)} disabled={isFetching}>Go to first page</Button>}
      </RetryAlert>
    </div>
  ) : hasNoMatches ? (
    <div className="p-6">
      <StateMessage type="no-results" title={`No assets match “${search}”`} description="Try a different name or description, or show every asset."
        action={<Button variant="secondary" onClick={handleClearSearch}>Show all assets</Button>} />
    </div>
  ) : assets.length === 0 ? (
    <div className="p-6">
      <StateMessage type="new-object" title="No assets found" description={`There are no nodes in ${ASSET_VIEW.space}.${ASSET_VIEW.externalId} to show yet.`} />
    </div>
  ) : view === AssetView.GRID
    ? <AssetGrid assets={assets} onAssetSelect={!isFetching ? onAssetSelect : undefined} />
    : <AssetTable assets={assets} onAssetSelect={!isFetching ? onAssetSelect : undefined} />;

  function handleClearSearch(): void {
    onSearchChange?.('');
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={<IconDatabase />} title="Assets" description="Live assets from CDF. Select one to open its equipment passport." />
      <TablePanel aria-label="Assets" aria-busy={isFetching}
        toolbar={(
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-64 flex-1"><AssetSearch search={search} onSearchChange={onSearchChange} /></div>
            <AssetViewToggle view={view} onViewChange={onViewChange} />
          </div>
        )}
        footer={
          <AssetPagination page={page} pageSize={pageSize} onPageSizeChange={onPageSizeChange} pageItemCount={assets.length} hasNextPage={hasNextPage}
            isFetching={isFetching} isLoading={isLoading} hasError={Boolean(errorMessage)} onPageChange={onPageChange} />
        }>
        {isSearchLimited && <p role="status" className="border-b border-border px-4 py-2 text-sm text-muted-foreground">Showing the top {ASSET_SEARCH_LIMIT} matches. Refine your search to narrow the results.</p>}
        {body}
      </TablePanel>
    </div>
  );
}
