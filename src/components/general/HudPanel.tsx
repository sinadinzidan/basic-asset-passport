import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type HudTone = 'cyan' | 'green' | 'sky' | 'amber' | 'red';

type HudPanelProps = {
  tone?: HudTone;
  tag?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function HudPanel({
  tone = 'cyan',
  tag,
  className,
  bodyClassName,
  children,
}: HudPanelProps) {
  return (
    <div className={cn('hud-glow', `tone-${tone}`, className)}>
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
    </div>
  );
}
