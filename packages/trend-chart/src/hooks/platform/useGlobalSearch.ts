import { useEffect, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '../../constants/formats';

/** The text after the typing pause, so a query is only sent when typing stops. */
export function useDebouncedText(
  text: string,
  delayMilliseconds: number = SEARCH_DEBOUNCE_MS,
): string {
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(text), delayMilliseconds);
    return () => window.clearTimeout(timer);
  }, [text, delayMilliseconds]);
  return debounced;
}
