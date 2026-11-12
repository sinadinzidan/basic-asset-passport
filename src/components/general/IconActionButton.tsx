import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

import { IconActionVariant } from '../../enums/iconActionVariant';

import { GeneralButton } from './GeneralButton';

const BUTTON_VARIANT_BY_ACTION_VARIANT = {
  [IconActionVariant.OUTLINE]: 'outline',
  [IconActionVariant.DESTRUCTIVE]: 'destructive',
} as const;

type IconActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isDisabled?: boolean;
  variant?: IconActionVariant;
  className?: string;
};

export function IconActionButton({
  label,
  icon,
  onClick,
  isDisabled = false,
  variant = IconActionVariant.OUTLINE,
  className,
}: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <GeneralButton
            aria-label={label}
            className={className}
            disabled={isDisabled}
            onClick={onClick}
            size="icon-sm"
            variant={BUTTON_VARIANT_BY_ACTION_VARIANT[variant]}
          >
            {icon}
          </GeneralButton>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
