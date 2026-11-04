import { Badge } from '@cognite/aura/components/badge';

import { getCriticalityTone } from '../../lib/assetCriticality';

type CriticalityPillProps = {
  criticality: string;
};

export function CriticalityPill({ criticality }: CriticalityPillProps) {
  const tone = getCriticalityTone(criticality);

  return (
    <Badge className="gap-2" data-tone={tone} variant="secondary">
      <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-current" />
      {criticality}
    </Badge>
  );
}
