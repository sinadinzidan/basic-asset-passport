import { IconBuildingFactory2, IconCircleCheck, IconEngine } from '@tabler/icons-react';

import {
  KPI_ASSETS_LABEL,
  KPI_COUNTS_ERROR_DESCRIPTION,
  KPI_COUNTS_ERROR_TITLE,
  KPI_EQUIPMENT_LABEL,
  KPI_OPERATING_LABEL,
} from '../../constants/assets';
import { PENDING_COUNT_LABEL } from '../../constants/labels';
import { useAssetsKPICounts } from '../../hooks/assets/useAssetsKPICounts';
import { formatCount } from '../../lib/countBadge';
import { getErrorReason } from '../../lib/errorReason';
import type { CountState } from '../../types/countState';
import { RetryAlert, StatTile } from '../general';

export function AssetsKPIs() {
  const { assets, operating, equipment, error, isRetrying, retry } = useAssetsKPICounts();

  return (
    <section aria-label="Register summary" className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label={KPI_ASSETS_LABEL}
          value={toCardValue(assets)}
          icon={<IconBuildingFactory2 className="size-6" />}
        />
        <StatTile
          label={KPI_OPERATING_LABEL}
          value={toCardValue(operating)}
          icon={<IconCircleCheck className="size-6" />}
        />
        <StatTile
          label={KPI_EQUIPMENT_LABEL}
          value={toCardValue(equipment)}
          icon={<IconEngine className="size-6" />}
        />
      </div>
      {error === null ? null : (
        <RetryAlert
          title={KPI_COUNTS_ERROR_TITLE}
          description={KPI_COUNTS_ERROR_DESCRIPTION}
          reason={getErrorReason(error)}
          isRetrying={isRetrying}
          onRetry={retry}
        />
      )}
    </section>
  );
}

function toCardValue({ count, isLoading }: CountState): string {
  return isLoading || count === null ? PENDING_COUNT_LABEL : formatCount(count);
}
