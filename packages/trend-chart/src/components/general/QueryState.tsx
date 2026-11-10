import { Button } from '@cognite/aura/components/button';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconRefresh } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { StateMessage } from './StateMessage';

interface QueryStateProps<Data> {
  data: Data | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  isEmpty?: (data: Data) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: Icon;
  skeletonRows?: number;
  children: (data: Data) => ReactNode;
}

const DEFAULT_SKELETON_ROWS = 4;

export function LoadingRows({ rows = DEFAULT_SKELETON_ROWS }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_unused, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <StateMessage
      variant="error"
      title="This could not be loaded"
      description={error.message}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <IconRefresh size={16} aria-hidden />
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

/**
 * Every data section handles loading, error, empty and success. Failures are shown and never turned
 * into empty lists or made-up success.
 */
export function QueryState<Data>({
  data,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon,
  skeletonRows,
  children,
}: QueryStateProps<Data>) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading || data === undefined) return <LoadingRows rows={skeletonRows} />;
  if (isEmpty?.(data)) {
    return <StateMessage icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }
  return <>{children(data)}</>;
}
