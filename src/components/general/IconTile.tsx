import type { ReactNode } from 'react';

// Literal class names so Tailwind can see them. Decorative ramps never imply status.
const TILE_CLASSES = {
  fjord: 'bg-decorative-background-fjord text-decorative-foreground-fjord',
  nordic: 'bg-decorative-background-nordic text-decorative-foreground-nordic',
  aurora: 'bg-decorative-background-aurora text-decorative-foreground-aurora',
  dusk: 'bg-decorative-background-dusk text-decorative-foreground-dusk',
} as const;

// Aura buttons colour any nested icon with a muted foreground using a selector of equal weight, so a tile inside a
// button would show an almost invisible icon on its pale background; the important flag keeps the tile's own colour.
const ICON_COLOR_CLASS = "[&_svg:not([class*='text-'])]:text-current!";

export function IconTile({ tone, children }: { tone: keyof typeof TILE_CLASSES; children: ReactNode }) {
  return <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5 ${ICON_COLOR_CLASS} ${TILE_CLASSES[tone]}`} aria-hidden>{children}</span>;
}
