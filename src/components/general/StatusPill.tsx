import { Badge } from '@cognite/aura/components/badge';
import { IconCircleCheck } from '@tabler/icons-react';

import { NOT_PROVIDED_LABEL } from '../../constants/labels';
import { StatusTone } from '../../enums/statusTone';

const DATA_TONE_BY_TONE: Record<StatusTone, string> = {
  [StatusTone.ACTIVE]: 'active',
  [StatusTone.WARNING]: 'warning',
  [StatusTone.NEUTRAL]: 'neutral',
};

type StatusPillProps = {
  status: string | null;
  tone?: StatusTone;
};

export function StatusPill({ status, tone = StatusTone.NEUTRAL }: StatusPillProps) {
  const label = status?.trim();

  if (!label) {
    return <span className="text-muted-foreground">{NOT_PROVIDED_LABEL}</span>;
  }

  return (
    <Badge className="gap-2" data-tone={DATA_TONE_BY_TONE[tone]} variant="secondary">
      {tone === StatusTone.ACTIVE ? (
        <span aria-hidden className="flex size-4 items-center justify-center">
          <IconCircleCheck className="size-4" />
        </span>
      ) : (
        <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-current" />
      )}
      {label}
    </Badge>
  );
}
