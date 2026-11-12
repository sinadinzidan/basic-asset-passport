import { AppAlertVariant } from '../../enums/appAlertVariant';

import { AppAlert } from './AppAlert';

export function MockModeNotice() {
  return (
    <AppAlert variant={AppAlertVariant.INFO}>
      Mock mode: showing dummy data, not data from Cognite Data Fusion.
    </AppAlert>
  );
}
