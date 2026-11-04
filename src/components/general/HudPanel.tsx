import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type HudTone = 'cyan' | 'green' | 'sky' | 'amber' | 'red';

type HudPanelProps = {
  tone?: HudTone;
  tag?: string;
  live?: boolean;
  className?: string;
  bodyClassName?: string;
  riseDelayMs?: number;
  children: ReactNode;
};

export function HudPanel({
  tone = 'cyan',
  tag,
  live = false,
  className,
  bodyClassName,
  riseDelayMs = 0,
  children,
}: HudPanelProps) {
  const style: CSSProperties & Record<'--rise-delay', string> = {
    '--rise-delay': `${riseDelayMs}ms`,
  };

  return (
    <div
      className={cn('hud-glow rise-in', `tone-${tone}`, className)}
      style={style}
    >
      <div className="hud-frame">
        <div className={cn('hud-body', bodyClassName)}>
          {tag ? (
            <span className="hud-tag hud-kicker">
              <span
                className={cn('hud-dot', live && 'hud-dot--live')}
                aria-hidden
              />
              {tag}
            </span>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
