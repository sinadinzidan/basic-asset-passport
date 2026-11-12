import { useId } from 'react';
import type { ReactNode } from 'react';

import { HudShape } from '../../enums/hudShape';

import { HudPanel } from './HudPanel';

type StatTileProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function StatTile({ label, value, icon }: StatTileProps) {
  const labelId = useId();

  return (
    <HudPanel shape={HudShape.NOTCHED} bodyClassName="stat-tile">
      <div role="group" aria-labelledby={labelId} className="stat-tile__content">
        <div className="stat-tile__head">
          <p id={labelId} className="hud-tag hud-kicker">
            <span className="hud-dot" aria-hidden />
            {label}
          </p>
          <span aria-hidden className="stat-tile__rule" />
          <span aria-hidden className="stat-tile__icon">
            {icon}
          </span>
        </div>
        <p className="font-display text-3xl font-semibold leading-tight tabular-nums">{value}</p>
      </div>
    </HudPanel>
  );
}
