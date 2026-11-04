import { Alert, AlertDescription } from '@cognite/aura/components/alert';

export function MockModeNotice() {
  return (
    <Alert variant="info">
      <AlertDescription>
        Mock mode: showing dummy data, not data from Cognite Data Fusion.
      </AlertDescription>
    </Alert>
  );
}
