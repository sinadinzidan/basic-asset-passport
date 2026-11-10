import { useState } from 'react';

export function useCursorPagination() {
  const [cursors, setCursors] = useState<string[]>([]);

  const cursor: string | undefined =
    cursors.length > 0 ? cursors[cursors.length - 1] : undefined;
  const pageNumber = cursors.length + 1;
  const hasPreviousPage = cursors.length > 0;

  function goToNextPage(nextCursor: string): void {
    setCursors((previous) => [...previous, nextCursor]);
  }

  function goToPreviousPage(): void {
    setCursors((previous) => previous.slice(0, -1));
  }

  function reset(): void {
    setCursors([]);
  }

  return {
    cursor,
    pageNumber,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    reset,
  };
}
