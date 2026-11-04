import { AppAlert } from './AppAlert';

export function MockModeNotice() {
  return (
    <AppAlert variant="info">
      Mock mode: showing dummy data, not data from Cognite Data Fusion.
    </AppAlert>
  );
}
