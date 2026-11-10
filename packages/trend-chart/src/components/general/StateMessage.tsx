import { IconAlertTriangle, IconFilterOff, IconInbox, IconInfoCircle, IconLock, type Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type StateVariant = 'empty' | 'noResults' | 'noAccess' | 'error' | 'info';
export type StateSize = 'panel' | 'inline';

const VARIANT_ICONS: Readonly<Record<StateVariant, Icon>> = {
  empty: IconInbox,
  noResults: IconFilterOff,
  noAccess: IconLock,
  error: IconAlertTriangle,
  info: IconInfoCircle,
};

const VARIANT_MARK: Readonly<Record<StateVariant, string>> = {
  empty: 'bg-muted-background text-muted-foreground',
  noResults: 'bg-muted-background text-muted-foreground',
  noAccess: 'bg-warning-muted-background text-warning-foreground',
  error: 'bg-destructive-muted-background text-destructive-foreground',
  info: 'bg-info-muted-background text-info-foreground',
};

interface StateMessageProps {
  variant?: StateVariant;
  icon?: Icon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  size?: StateSize;
  className?: string;
}

export function StateMessage({
  variant = 'empty',
  icon,
  title,
  description,
  action,
  size = 'panel',
  className,
}: StateMessageProps) {
  const Mark = icon ?? VARIANT_ICONS[variant];
  const panel = size === 'panel';
  return (
    <div
      role={variant === 'error' ? 'alert' : panel ? 'status' : undefined}
      data-variant={variant}
      className={cn(
        'chart-state flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted-background/30 text-center',
        panel ? 'px-6 py-10' : 'px-4 py-5',
        className,
      )}
    >
      <span
        className={cn(
          'chart-state__mark flex shrink-0 items-center justify-center rounded-full',
          panel ? 'size-12' : 'size-9',
          VARIANT_MARK[variant],
        )}
      >
        <Mark size={panel ? 24 : 18} aria-hidden />
      </span>
      <div className="flex max-w-xl flex-col gap-1">
        {panel ? (
          <h3 className="chart-state__title text-base font-semibold text-foreground">{title}</h3>
        ) : (
          <p className="chart-state__title text-sm font-semibold text-foreground">{title}</p>
        )}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}
