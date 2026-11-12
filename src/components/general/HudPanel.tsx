import type { ReactNode } from 'react';

import { HudShape } from '../../enums/hudShape';
import { HudTone } from '../../enums/hudTone';
import { cn } from '../../lib/utils';

import { HudVent } from './HudVent';

const TONE_CLASS_NAMES: Record<HudTone, string> = {
  [HudTone.CYAN]: 'tone-cyan',
  [HudTone.GREEN]: 'tone-green',
  [HudTone.SKY]: 'tone-sky',
  [HudTone.AMBER]: 'tone-amber',
  [HudTone.RED]: 'tone-red',
};

const SHAPE_CLASS_NAMES: Record<HudShape, string | null> = {
  [HudShape.PLAIN]: null,
  [HudShape.NOTCHED]: 'hud-notched',
  [HudShape.SCREEN]: 'hud-screen',
};

type HudPanelProps = {
  tone?: HudTone;
  tag?: string;
  shape?: HudShape;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function HudPanel({
  tone = HudTone.CYAN,
  tag,
  shape = HudShape.PLAIN,
  className,
  bodyClassName,
  children,
}: HudPanelProps) {
  return (
    <div className={cn('hud-glow', TONE_CLASS_NAMES[tone], SHAPE_CLASS_NAMES[shape], className)}>
      <div className="hud-frame">
        <div className={cn('hud-body', bodyClassName)}>
          {tag ? (
            <span className="hud-tag hud-kicker">
              <span className="hud-dot" aria-hidden />
              {tag}
            </span>
          ) : null}
          {children}
        </div>
      </div>
      {shape === HudShape.NOTCHED ? <HudVent /> : null}
    </div>
  );
}
