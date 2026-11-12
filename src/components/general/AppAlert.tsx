import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconInfoCircle,
  type Icon as TablerIcon,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { AppAlertVariant } from '../../enums/appAlertVariant';

type AppAlertProps = {
  variant: AppAlertVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
};

const ICON_BY_VARIANT: Record<AppAlertVariant, TablerIcon> = {
  [AppAlertVariant.ERROR]: IconAlertCircle,
  [AppAlertVariant.WARNING]: IconAlertTriangle,
  [AppAlertVariant.INFO]: IconInfoCircle,
  [AppAlertVariant.SUCCESS]: IconCircleCheck,
};

const DATA_VARIANT_BY_VARIANT: Record<AppAlertVariant, string> = {
  [AppAlertVariant.ERROR]: 'error',
  [AppAlertVariant.WARNING]: 'warning',
  [AppAlertVariant.INFO]: 'info',
  [AppAlertVariant.SUCCESS]: 'success',
};

const ROLE_BY_VARIANT: Record<AppAlertVariant, 'alert' | 'status'> = {
  [AppAlertVariant.ERROR]: 'alert',
  [AppAlertVariant.WARNING]: 'alert',
  [AppAlertVariant.INFO]: 'status',
  [AppAlertVariant.SUCCESS]: 'status',
};

export function AppAlert({ variant, title, children, action }: AppAlertProps) {
  const Icon = ICON_BY_VARIANT[variant];

  return (
    <div
      role={ROLE_BY_VARIANT[variant]}
      data-variant={DATA_VARIANT_BY_VARIANT[variant]}
      className="app-alert flex w-full items-center gap-3 text-sm"
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
