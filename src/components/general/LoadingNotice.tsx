import { Loader } from '@cognite/aura/components/loader';

import { cn } from '../../lib/utils';

import { HudPanel } from './HudPanel';

type LoadingNoticeProps = {
  message: string;
  className?: string;
};

export function LoadingNotice({ message, className }: LoadingNoticeProps) {
  return (
    <HudPanel>
      <div
        role="status"
        className={cn(
          'flex items-center gap-3 font-mono text-muted-foreground',
          className,
        )}
      >
        <Loader aria-hidden size={20} />
        <span>{message}</span>
      </div>
    </HudPanel>
  );
}
