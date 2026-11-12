import {
  IconAlertTriangle,
  IconFilterOff,
  IconInbox,
  IconInfoCircle,
  IconLock,
  type Icon,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { StateSize } from '../../enums/stateSize';
import { StateVariant } from '../../enums/stateVariant';
import { cn } from '../../lib/utils';

const PANEL_MARK_SIZE_PX = 24;
const INLINE_MARK_SIZE_PX = 18;

const VARIANT_ICONS: Readonly<Record<StateVariant, Icon>> = {
  [StateVariant.EMPTY]: IconInbox,
  [StateVariant.NO_RESULTS]: IconFilterOff,
  [StateVariant.NO_ACCESS]: IconLock,
  [StateVariant.ERROR]: IconAlertTriangle,
  [StateVariant.INFO]: IconInfoCircle,
};

const VARIANT_MARK: Readonly<Record<StateVariant, string>> = {
  [StateVariant.EMPTY]: 'bg-muted-background text-muted-foreground',
  [StateVariant.NO_RESULTS]: 'bg-muted-background text-muted-foreground',
  [StateVariant.NO_ACCESS]: 'bg-warning-muted-background text-warning-foreground',
  [StateVariant.ERROR]: 'bg-destructive-muted-background text-destructive-foreground',
  [StateVariant.INFO]: 'bg-info-muted-background text-info-foreground',
};

// The value `[data-variant]` in chart.css and the tests match on.
const DATA_VARIANT_BY_VARIANT: Readonly<Record<StateVariant, string>> = {
  [StateVariant.EMPTY]: 'empty',
  [StateVariant.NO_RESULTS]: 'noResults',
  [StateVariant.NO_ACCESS]: 'noAccess',
  [StateVariant.ERROR]: 'error',
  [StateVariant.INFO]: 'info',
};

interface StateMessageProperties {
  variant?: StateVariant;
  icon?: Icon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  size?: StateSize;
  className?: string;
}

export function StateMessage({
  variant = StateVariant.EMPTY,
  icon,
  title,
  description,
  action,
  size = StateSize.PANEL,
  className,
}: StateMessageProperties) {
  const Mark = icon ?? VARIANT_ICONS[variant];
  const isPanel = size === StateSize.PANEL;
  return (
    <div
      role={variant === StateVariant.ERROR ? 'alert' : isPanel ? 'status' : undefined}
      data-variant={DATA_VARIANT_BY_VARIANT[variant]}
      className={cn(
        'chart-state flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted-background/30 text-center',
        isPanel ? 'px-6 py-10' : 'px-4 py-5',
        className,
      )}
    >
      <span
        className={cn(
          'chart-state__mark flex shrink-0 items-center justify-center rounded-full',
          isPanel ? 'size-12' : 'size-9',
          VARIANT_MARK[variant],
        )}
      >
        <Mark size={isPanel ? PANEL_MARK_SIZE_PX : INLINE_MARK_SIZE_PX} aria-hidden />
      </span>
      <div className="flex max-w-xl flex-col gap-1">
        {isPanel ? (
          <h3 className="chart-state__title text-base font-semibold text-foreground">{title}</h3>
        ) : (
          <p className="chart-state__title text-sm font-semibold text-foreground">{title}</p>
        )}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <div className="flex flex-wrap items-center justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
