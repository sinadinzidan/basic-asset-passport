import { useEffect, useRef } from 'react';

export function useScrollToEnd<T extends HTMLElement>(itemCount: number, isBusy: boolean) {
  const reference = useRef<T>(null);

  useEffect(() => {
    const element = reference.current;

    if (element !== null) element.scrollTop = element.scrollHeight;
  }, [itemCount, isBusy]);

  return reference;
}
