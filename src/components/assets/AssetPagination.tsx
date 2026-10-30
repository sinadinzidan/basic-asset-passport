import { Pagination, PaginationContent, PaginationFirst, PaginationItem, PaginationNext, PaginationPrevious, PaginationResultsPerPage, PaginationResultsPerPageLabel, PaginationSelectTrigger, PaginationStatus } from '@cognite/aura/components/pagination';
import { Select, SelectContent, SelectItem, SelectValue } from '@cognite/aura/components/select';
import type { MouseEvent } from 'react';

import { ASSET_PAGE_SIZE_OPTIONS } from '../../constants/assets';
import { LoadingNotice } from '../general/LoadingNotice';

export function AssetPagination({ page, pageSize, onPageSizeChange, pageItemCount, hasNextPage, isFetching, isLoading, hasError, onPageChange }: {
  page: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  pageItemCount: number;
  hasNextPage: boolean;
  isFetching: boolean;
  isLoading: boolean;
  hasError: boolean;
  onPageChange: (page: number) => void;
}) {
  const createPageClickHandler = (targetPage: number) => (event: MouseEvent) => {
    event.preventDefault();
    onPageChange(targetPage);
  };
  const first = page * pageSize + 1;
  const canGoBack = page > 0 && !isFetching;
  const canGoForward = hasNextPage && !isFetching && !hasError;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Pagination size="small" aria-label="Asset pagination" className="mx-0 w-auto justify-start">
        <PaginationContent className="flex-wrap">
          <PaginationItem><PaginationFirst href="#" label="First page" isDisabled={!canGoBack} onClick={createPageClickHandler(0)} /></PaginationItem>
          <PaginationItem><PaginationPrevious href="#" label="Previous page" isDisabled={!canGoBack} onClick={createPageClickHandler(page - 1)} /></PaginationItem>
          <PaginationItem><PaginationStatus className="whitespace-nowrap">Page {page + 1}</PaginationStatus></PaginationItem>
          <PaginationItem><PaginationNext href="#" label="Next page" isDisabled={!canGoForward} onClick={createPageClickHandler(page + 1)} /></PaginationItem>
          <PaginationResultsPerPage>
            <PaginationResultsPerPageLabel id="asset-page-size-label" className="whitespace-nowrap">Results per page</PaginationResultsPerPageLabel>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <PaginationSelectTrigger size="sm" aria-labelledby="asset-page-size-label" disabled={isFetching}><SelectValue /></PaginationSelectTrigger>
              <SelectContent>
                {ASSET_PAGE_SIZE_OPTIONS.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </PaginationResultsPerPage>
        </PaginationContent>
      </Pagination>
      <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {isFetching && !isLoading
          ? <LoadingNotice label={`Loading page ${page + 1}`} size="small" />
          : pageItemCount > 0 && <>Showing {pageItemCount === 1 ? first : `${first}–${first + pageItemCount - 1}`}{hasNextPage ? '' : ' (last page)'}</>}
      </div>
    </div>
  );
}
