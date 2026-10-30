import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';

import { decorativeVariantFor, initialsOf } from '../../lib/decorative';

/** A decorative avatar: the initials of a name on a colour derived from a stable key. Hidden from assistive tech. */
export function InitialsAvatar({ name, colorKey }: { name: string; colorKey?: string }) {
  return <Avatar variant={decorativeVariantFor(colorKey ?? name)} aria-hidden><AvatarFallback>{initialsOf(name)}</AvatarFallback></Avatar>;
}
