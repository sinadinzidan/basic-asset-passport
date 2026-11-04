import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';

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
    <Alert variant="error">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertActions>
        <Button disabled={isRetrying} onClick={onRetry} variant="secondary">
          Retry
        </Button>
      </AlertActions>
    </Alert>
  );
}
