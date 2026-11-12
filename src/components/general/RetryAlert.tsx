import { REASON_LABEL, RETRY_LABEL } from '../../constants/labels';
import { AppAlertVariant } from '../../enums/appAlertVariant';

import { AppAlert } from './AppAlert';
import { GeneralButton } from './GeneralButton';

type RetryAlertProps = {
  title: string;
  description: string;
  reason?: string | null;
  isRetrying: boolean;
  onRetry: () => void;
};

export function RetryAlert({ title, description, reason, isRetrying, onRetry }: RetryAlertProps) {
  return (
    <AppAlert
      variant={AppAlertVariant.ERROR}
      title={title}
      action={
        <GeneralButton disabled={isRetrying} onClick={onRetry} variant="secondary">
          {RETRY_LABEL}
        </GeneralButton>
      }
    >
      <p>{description}</p>
      {reason ? (
        <p className="mt-1 break-words text-muted-foreground">
          {REASON_LABEL}: {reason}
        </p>
      ) : null}
    </AppAlert>
  );
}
