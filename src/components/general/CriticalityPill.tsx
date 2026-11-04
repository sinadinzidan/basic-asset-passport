import { Badge } from '@cognite/aura/components/badge';

import {
  getCriticalityTone,
  type CriticalityTone,
} from '../../lib/assetCriticality';

type CriticalityPillProps = {
  criticality: string;
};

const BADGE_VARIANT_BY_TONE = {
  error: 'error',
  warning: 'warning',
  info: 'inProgress',
  neutral: 'secondary',
} as const satisfies Record<CriticalityTone, string>;

const DOT_CLASS_BY_TONE: Record<CriticalityTone, string> = {
  error: 'bg-critical-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  info: 'bg-info-foreground-strong',
  neutral: 'bg-muted-foreground',
};

export function CriticalityPill({ criticality }: CriticalityPillProps) {
  const tone = getCriticalityTone(criticality);

  return (
    <Badge
      className="gap-2"
      data-tone={tone}
      variant={BADGE_VARIANT_BY_TONE[tone]}
    >
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rotate-45 ${DOT_CLASS_BY_TONE[tone]}`}
      />
      {criticality}
    </Badge>
  );
}
