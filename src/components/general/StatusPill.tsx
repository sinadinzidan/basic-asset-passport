import { Badge } from '@cognite/aura/components/badge';
import { IconCircleCheck } from '@tabler/icons-react';

import { NOT_PROVIDED_LABEL } from '../../constants/labels';

type StatusPillTone = 'neutral' | 'success';

type StatusPillProps = {
  status: string | null;
  tone?: StatusPillTone;
};

export function StatusPill({ status, tone = 'neutral' }: StatusPillProps) {
  const label = status?.trim();

  if (!label) {
    return <span className="text-muted-foreground">{NOT_PROVIDED_LABEL}</span>;
  }

  const isSuccess = tone === 'success';

  return (
    <Badge
      className="gap-2"
      data-tone={tone}

      variant={isSuccess ? 'success' : 'secondary'}
    >
      {isSuccess ? (
        <span aria-hidden className="flex size-4 items-center justify-center">
          <IconCircleCheck className="size-4" />
        </span>
      ) : (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rotate-45 bg-muted-foreground"
        />
      )}
      {label}
    </Badge>
  );
}
