import { Card } from '@cognite/aura/components/card';
import type { ComponentProps } from 'react';

/** An Aura Card with a visible edge, so cards stay distinct from the page and from each other. */
export function SurfaceCard({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={className ? `border border-border ${className}` : 'border border-border'} {...props} />;
}
