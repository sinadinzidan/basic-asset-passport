import { IconBuildingFactory2, IconCircleCheck, IconEngine } from '@tabler/icons-react';

import {
  SUMMARY_ASSETS_LABEL,
  SUMMARY_COUNTS_ERROR_DESCRIPTION,
  SUMMARY_COUNTS_ERROR_TITLE,
  SUMMARY_EQUIPMENT_LABEL,
  SUMMARY_OPERATING_LABEL,
} from '../../constants/assets';
import { PENDING_COUNT_LABEL } from '../../constants/labels';
import { useRegisterSummary } from '../../hooks/assets/useRegisterSummary';
import { formatCount } from '../../lib/countBadge';
import { getErrorReason } from '../../lib/errorReason';
import type { CountState } from '../../types/countState';
import { RetryAlert, StatTile } from '../general';

export function RegisterSummary() {
  const { assets, operating, equipment, error, isRetrying, retry } = useRegisterSummary();

  return (
    <section aria-label="Register summary" className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label={SUMMARY_ASSETS_LABEL}
          value={toCardValue(assets)}
          icon={<IconBuildingFactory2 className="size-6" />}
        />
        <StatTile
          label={SUMMARY_OPERATING_LABEL}
          value={toCardValue(operating)}
          icon={<IconCircleCheck className="size-6" />}
        />
        <StatTile
          label={SUMMARY_EQUIPMENT_LABEL}
          value={toCardValue(equipment)}
          icon={<IconEngine className="size-6" />}
        />
      </div>
      {error === null ? null : (
        <RetryAlert
          title={SUMMARY_COUNTS_ERROR_TITLE}
          description={SUMMARY_COUNTS_ERROR_DESCRIPTION}
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
