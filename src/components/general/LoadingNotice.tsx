import { Loader } from '@cognite/aura/components/loader';

import { cn } from '../../lib/utils';

import { HudPanel } from './HudPanel';

type LoadingNoticeProps = {
  message: string;
  className?: string;
  /** PANEL is the glowing hero panel; CARD is a plain data card for loading inside a tab. */
  variant?: 'PANEL' | 'CARD';
};

export function LoadingNotice({
  message,
  className,
  variant = 'PANEL',
}: LoadingNoticeProps) {
  const content = (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 font-mono text-muted-foreground',
        variant === 'CARD' && 'data-card',
        className,
      )}
    >
      <Loader aria-hidden size={20} />
      <span>{message}</span>
    </div>
  );

  return variant === 'CARD' ? content : <HudPanel>{content}</HudPanel>;
}
