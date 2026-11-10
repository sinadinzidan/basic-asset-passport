import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

import { GeneralButton } from './GeneralButton';

type IconActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isDisabled?: boolean;
  variant?: 'outline' | 'destructive';
};

/** A small icon-only button. The label is its accessible name and its tooltip. */
export function IconActionButton({
  label,
  icon,
  onClick,
  isDisabled = false,
  variant = 'outline',
}: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <GeneralButton
            aria-label={label}
            disabled={isDisabled}
            onClick={onClick}
            size="icon-sm"
            variant={variant}
          >
            {icon}
          </GeneralButton>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
