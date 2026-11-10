import { Button } from '@cognite/aura/components/button';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '../../lib/utils';

type GeneralButtonProps = ComponentPropsWithoutRef<typeof Button>;

/**
 * The app's button: Aura's `Button` with the HUD pill look. Use it instead of
 * Aura's `Button` so every button shares one shape and the styling hooks
 * (see `styles.css`) are set in a single place: the `hud-button` class, and
 * `data-variant` and `data-size`, which tell the stylesheet which variant and
 * size this is so it does not have to guess from Aura's internal class names.
 * It forwards its ref because tooltip and dialog triggers attach to it.
 */
export const GeneralButton = forwardRef<HTMLElement, GeneralButtonProps>(
  function GeneralButton({ className, size, variant, ...props }, ref) {
    return (
      <Button
        ref={ref}
        className={cn('hud-button', className)}
        data-size={size ?? 'default'}
        data-variant={variant ?? 'default'}
        size={size}
        variant={variant}
        {...props}
      />
    );
  },
);
