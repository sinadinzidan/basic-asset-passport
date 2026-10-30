import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

interface PdfPageStateOptions {
  controlledPage?: number;
  onPageChange?: (page: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

// Controlled + uncontrolled current page; the pan resets whenever the page changes.
export function usePdfPageState({ controlledPage, onPageChange, onPanChange }: PdfPageStateOptions) {
  const [internalPage, setInternalPage] = useState(1);
  const onPanChangeRef = useRef(onPanChange);

  const currentPage = controlledPage ?? internalPage;

  const handlePageChange = useCallback(
    (newPage: number) => {
      setInternalPage(newPage);
      onPageChange?.(newPage);
    },
    [onPageChange],
  );

  useLayoutEffect(() => { onPanChangeRef.current = onPanChange; }, [onPanChange]);
  useEffect(() => {
    onPanChangeRef.current({ x: 0, y: 0 });
  }, [currentPage]);

  return { currentPage, handlePageChange };
}

// Tracks the rendered size of the page wrapper so overlays can be positioned over it.
export function usePageDimensions() {
  const [pageDims, setPageDims] = useState({ width: 0, height: 0 });
  const pageObserverRef = useRef<ResizeObserver | null>(null);

  const pageWrapperRef = useCallback((node: HTMLDivElement | null) => {
    if (pageObserverRef.current) {
      pageObserverRef.current.disconnect();
      pageObserverRef.current = null;
    }
    if (node) {
      const measure = () => {
        const w = node.clientWidth;
        const h = node.clientHeight;
        setPageDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      };
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      measure();
      pageObserverRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      pageObserverRef.current?.disconnect();
      pageObserverRef.current = null;
    };
  }, []);

  return { pageDims, pageWrapperRef };
}
