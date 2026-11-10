import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { Icon } from '@tabler/icons-react';

interface IconTooltipButtonProps {
  label: string;
  tooltip?: string;
  icon: Icon;
  onClick: () => void;
  isPressed?: boolean;
}

export function IconTooltipButton({ label, tooltip, icon: Mark, onClick, isPressed }: IconTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} aria-pressed={isPressed} onClick={onClick} />}
      >
        <Mark size={16} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}
