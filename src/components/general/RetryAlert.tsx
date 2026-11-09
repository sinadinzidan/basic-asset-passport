import { Button } from '@cognite/aura/components/button';

import { AppAlert } from './AppAlert';

type RetryAlertProps = {
  title: string;
  description: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export function RetryAlert({
  title,
  description,
  isRetrying,
  onRetry,
}: RetryAlertProps) {
  return (
    <AppAlert
      variant="error"
      title={title}
      action={
        <Button
          className="hud-button"
          disabled={isRetrying}
          onClick={onRetry}
          variant="secondary"
        >
          Retry
        </Button>
      }
    >
      {description}
    </AppAlert>
  );
}
