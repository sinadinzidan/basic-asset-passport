import { Button } from '@cognite/aura/components/button';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { cn } from '../../lib/utils';

type GeneralButtonProps = ComponentPropsWithoutRef<typeof Button>;

export const GeneralButton = forwardRef<HTMLElement, GeneralButtonProps>(function GeneralButton(
  { className, size, variant, ...properties },
  reference,
) {
  return (
    <Button
      ref={reference}
      className={cn('hud-button', className)}
      data-size={size ?? 'default'}
      data-variant={variant ?? 'default'}
      size={size}
      variant={variant}
      {...properties}
    />
  );
});
