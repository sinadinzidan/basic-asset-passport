import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ReactNode } from 'react';

interface TooltipTargetProperties {
  text: string;
  children: ReactNode;
}

/** A tooltip around a control that is already a trigger of its own (a popover or a menu), which cannot also be the tooltip's trigger. */
export function TooltipTarget({ text, children }: TooltipTargetProperties) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
