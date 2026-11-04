import type { ReactNode } from 'react';

import { HudPanel } from './HudPanel';

type StatTileProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <HudPanel bodyClassName="hud-row">
      <span aria-hidden className="icon-chip size-12">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-semibold leading-tight tabular-nums">
          {value}
        </p>
      </div>
    </HudPanel>
  );
}
