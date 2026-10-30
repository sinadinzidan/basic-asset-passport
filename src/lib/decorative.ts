import type { Avatar } from '@cognite/aura/components/avatar';
import type { ComponentProps } from 'react';

type AvatarVariant = NonNullable<ComponentProps<typeof Avatar>['variant']>;

const HASH_MULTIPLIER = 31;

// Decorative ramps in Aura's preference order; they differentiate items, they never signal status.
const DECORATIVE_VARIANTS = ['fjord', 'nordic', 'aurora', 'dusk', 'orange', 'sky'] as const satisfies readonly AvatarVariant[];

export type DecorativeVariant = (typeof DECORATIVE_VARIANTS)[number];

export function decorativeVariantFor(key: string): DecorativeVariant {
  let hash = 0;
  for (const character of key) hash = (hash * HASH_MULTIPLIER + character.charCodeAt(0)) >>> 0;
  return DECORATIVE_VARIANTS[hash % DECORATIVE_VARIANTS.length];
}

export function initialsOf(name: string): string {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  // Spread into code points so a character outside the Basic Multilingual Plane is never cut in half.
  const [first = '?', second = ''] = words.length > 1 ? [[...words[0]][0], [...words[1]][0]] : [...(words[0] ?? '?')];
  return (first + second).toUpperCase();
}

// Literal class names so Tailwind can see them.
export const HIGHLIGHT_TILE_CLASSES: readonly string[] = [
  'bg-decorative-background-fjord text-decorative-foreground-fjord',
  'bg-decorative-background-nordic text-decorative-foreground-nordic',
  'bg-decorative-background-aurora text-decorative-foreground-aurora',
  'bg-decorative-background-dusk text-decorative-foreground-dusk',
];
