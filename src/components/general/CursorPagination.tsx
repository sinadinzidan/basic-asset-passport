import { Button } from '@cognite/aura/components/button';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

type CursorPaginationProps = {
  label: string;
  pageNumber: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isFetching: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function CursorPagination({
  label,
  pageNumber,
  hasPreviousPage,
  hasNextPage,
  isFetching,
  onPreviousPage,
  onNextPage,
}: CursorPaginationProps) {
  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-3 border-t border-default bg-muted-background/50 px-5 py-3"
    >
      <span
        aria-live="polite"
        className="text-sm font-medium text-muted-foreground"
      >
        Page {pageNumber}
      </span>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous page"
          disabled={!hasPreviousPage || isFetching}
          onClick={onPreviousPage}
          className="hud-button"
          size="sm"
          variant="outline"
        >
          <IconChevronLeft aria-hidden />
          Previous
        </Button>
        <Button
          aria-label="Next page"
          disabled={!hasNextPage || isFetching}
          onClick={onNextPage}
          className="hud-button"
          size="sm"
          variant="outline"
        >
          Next
          <IconChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
