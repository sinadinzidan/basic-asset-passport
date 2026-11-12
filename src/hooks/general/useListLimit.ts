import { useState } from 'react';

export function useListLimit(pageSize: number) {
  const [limit, setLimit] = useState(pageSize);

  function showMore(): void {
    setLimit((previousLimit) => previousLimit + pageSize);
  }

  return { limit, showMore };
}
