import { AppAlert } from './AppAlert';
import { GeneralButton } from './GeneralButton';


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
        <GeneralButton
          disabled={isRetrying}
          onClick={onRetry}
          variant="secondary"
        >
          Retry
        </GeneralButton>
      }
    >
      {description}
    </AppAlert>
  );
}
