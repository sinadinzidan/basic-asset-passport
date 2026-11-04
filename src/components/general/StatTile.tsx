import type { ReactNode } from 'react';

import { GlassCard } from './GlassCard';

type StatTileProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <GlassCard className="page-enter flex items-center gap-4 p-5">
      <span aria-hidden className="icon-chip size-12">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold leading-tight tabular-nums">
          {value}
        </p>
      </div>
    </GlassCard>
  );
}
