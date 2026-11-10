import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  type Icon as TablerIcon,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type AppAlertVariant = 'error' | 'warning' | 'info' | 'success';

type AppAlertProps = {
  variant: AppAlertVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

// Colours live in styles.css (`.app-alert[data-variant]`); only the icon differs here.
const ICON_BY_VARIANT: Record<AppAlertVariant, TablerIcon> = {
  error: IconAlertCircle,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
  success: IconCircleCheck,
};

// Errors and warnings interrupt a screen reader; info and success wait their turn.
const ROLE_BY_VARIANT: Record<AppAlertVariant, 'alert' | 'status'> = {
  error: 'alert',
  warning: 'alert',
  info: 'status',
  success: 'status',
};

export function AppAlert({
  variant,
  title,
  children,
  action,
  className,
}: AppAlertProps) {
  const Icon = ICON_BY_VARIANT[variant];

  return (
    <div
      role={ROLE_BY_VARIANT[variant]}
      data-variant={variant}
      className={cn('app-alert flex w-full items-center gap-3 text-sm', className)}
    >
      <span aria-hidden className="app-alert__icon">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="app-alert__title">{title}</p> : null}
        <div className="app-alert__body">{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
