import { Loader } from '@cognite/aura/components/loader';

import { GlassCard } from './GlassCard';

type LoadingNoticeProps = {
  message: string;
  className?: string;
};

export function LoadingNotice({ message, className }: LoadingNoticeProps) {
  return (
    <GlassCard className={className}>
      <div
        role="status"
        className="flex items-center gap-3 font-mono text-muted-foreground"
      >
        <Loader aria-hidden size={20} />
        <span>{message}</span>
      </div>
    </GlassCard>
  );
}
