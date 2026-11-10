import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { Icon } from '@tabler/icons-react';

interface ToolbarToggleProps {
  label: string;
  icon: Icon;
  isActive?: boolean;
  isRunningTone?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export function ToolbarToggle({
  label,
  icon: ToolIcon,
  isActive,
  isRunningTone = false,
  isDisabled = false,
  onClick,
}: ToolbarToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-8"
            aria-label={label}
            aria-pressed={isActive}
            data-running-tone={isRunningTone && isActive ? 'success' : undefined}
            disabled={isDisabled}
            onClick={onClick}
          />
        }
      >
        <ToolIcon size={16} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
