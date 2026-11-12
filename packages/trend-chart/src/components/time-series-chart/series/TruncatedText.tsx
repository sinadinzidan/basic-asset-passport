import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';

import { cn } from '../../../lib/utils';

interface TruncatedTextProperties {
  text: string;
  className?: string;
}

export function TruncatedText({ text, className }: TruncatedTextProperties) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              'block truncate rounded-sm focus-visible:outline-2 focus-visible:outline-ring',
              className,
            )}
          />
        }
      >
        {text}
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
