import { Badge } from '@cognite/aura/components/badge';

import { CriticalityTone } from '../../enums/criticalityTone';
import { getCriticalityTone } from '../../lib/assetCriticality';

const DATA_TONE_BY_TONE: Record<CriticalityTone, string> = {
  [CriticalityTone.ERROR]: 'error',
  [CriticalityTone.WARNING]: 'warning',
  [CriticalityTone.SUCCESS]: 'success',
  [CriticalityTone.NEUTRAL]: 'neutral',
};

type CriticalityPillProps = {
  criticality: string;
};

export function CriticalityPill({ criticality }: CriticalityPillProps) {
  const tone = getCriticalityTone(criticality);

  return (
    <Badge className="gap-2" data-tone={DATA_TONE_BY_TONE[tone]} variant="secondary">
      <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-current" />
      {criticality}
    </Badge>
  );
}
