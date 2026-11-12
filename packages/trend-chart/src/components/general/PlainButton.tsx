import { Button } from '@cognite/aura/components/button';
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

type PlainButtonProperties = Omit<ComponentProps<typeof Button>, 'variant' | 'size'>;

/**
 * Aura's button for a press target that is a whole surface: the chart's title, an alert in a list, a marker on
 * the time axis. It keeps Aura's button behaviour and drops the shape, since the content gives the look. Aura has
 * no variant for this, so the shape is taken off its ghost variant here, in one place. Focus shows as an outline
 * rather than Aura's ring, which the bar and the lists around these buttons would clip.
 */
export function PlainButton({ className, ...properties }: PlainButtonProperties) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'chart-plain-button h-auto shrink justify-start rounded-sm p-0 text-left font-normal whitespace-normal hover:bg-transparent has-[>svg]:px-0',
        'focus-visible:shadow-none! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
        className,
      )}
      {...properties}
    />
  );
}
