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

type VariantStyle = {
  Icon: TablerIcon;
  container: string;
  icon: string;
};

// Full class names are written out so Tailwind can find them.
const STYLE_BY_VARIANT: Record<AppAlertVariant, VariantStyle> = {
  error: {
    Icon: IconAlertCircle,
    container: 'border-critical-foreground/25 bg-critical-background',
    icon: 'text-critical-foreground-strong',
  },
  warning: {
    Icon: IconAlertTriangle,
    container: 'border-warning-foreground/25 bg-warning-background',
    icon: 'text-warning-foreground-strong',
  },
  info: {
    Icon: IconInfoCircle,
    container: 'border-info-foreground/25 bg-info-background',
    icon: 'text-info-foreground-strong',
  },
  success: {
    Icon: IconCircleCheck,
    container: 'border-success-foreground/25 bg-success-background',
    icon: 'text-success-foreground-strong',
  },
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
  const { Icon, container, icon } = STYLE_BY_VARIANT[variant];

  return (
    <div
      role={ROLE_BY_VARIANT[variant]}
      data-variant={variant}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        container,
        className,
      )}
    >
      <Icon aria-hidden className={cn('size-5 shrink-0', icon)} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="font-semibold text-base-foreground">{title}</p>
        ) : null}
        <div className="text-base-foreground">{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
