import { Loader } from '@cognite/aura/components/loader';

import { LoadingNoticeVariant } from '../../enums/loadingNoticeVariant';
import { cn } from '../../lib/utils';

import { HudPanel } from './HudPanel';

type LoadingNoticeProps = {
  message: string;
  className?: string;
  variant?: LoadingNoticeVariant;
};

export function LoadingNotice({
  message,
  className,
  variant = LoadingNoticeVariant.PANEL,
}: LoadingNoticeProps) {
  const content = (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 font-mono text-muted-foreground',
        variant === LoadingNoticeVariant.CARD && 'data-card',
        className,
      )}
    >
      <Loader aria-hidden size={20} />
      <span>{message}</span>
    </div>
  );

  return variant === LoadingNoticeVariant.CARD ? content : <HudPanel>{content}</HudPanel>;
}
