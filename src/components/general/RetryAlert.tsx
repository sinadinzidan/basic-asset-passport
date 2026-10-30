import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

/** The one error alert of the app: a message, an optional Retry and any extra actions. */
export function RetryAlert({ message, onRetry, isBusy = false, children }: {
  /** The full message, for example "Failed to load files: Forbidden". */
  message: string;
  onRetry?: () => void;
  isBusy?: boolean;
  /** Extra actions, shown after Retry. */
  children?: ReactNode;
}) {
  return (
    <Alert role="alert">
      <AlertDescription>{message}</AlertDescription>
      {onRetry && <Button variant="secondary" onClick={onRetry} disabled={isBusy}>Retry</Button>}
      {children}
    </Alert>
  );
}
