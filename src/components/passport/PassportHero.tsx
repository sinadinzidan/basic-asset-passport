import { Badge } from '@cognite/aura/components/badge';
import { CardContent } from '@cognite/aura/components/card';
import { IconMapPin } from '@tabler/icons-react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';

import { ICON_SIZE_INLINE_PX } from '../../constants/ui';
import { decorativeVariantFor } from '../../lib/decorative';
import { revealMotion } from '../../lib/motion';
import type { LabeledValue } from '../../types/asset';
import { SurfaceCard } from '../general/SurfaceCard';

type PassportHeroProps = {
  icon: ReactNode;
  /** A short line above the title, such as which asset the equipment is on. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Shows the description in a monospace face, for an identifier rather than a sentence. */
  descriptionMono?: boolean;
  badges?: LabeledValue[];
  /** One extra badge for the state of the page, such as "No equipment linked". */
  status?: ReactNode;
  location?: string;
  stats: { label: string; value?: number }[];
};

/** The top of every asset page, with or without equipment: icon, title, tags and the at-a-glance numbers. */
export function PassportHero({ icon, eyebrow, title, description, descriptionMono = false, badges = [], status, location, stats }: PassportHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div {...revealMotion(0, reduceMotion)}>
      <SurfaceCard className="overflow-hidden p-0">
        <div className="h-1.5 [background-image:var(--gradient-aurora)]" aria-hidden />
        <CardContent className="flex-row flex-wrap items-start gap-5 p-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl p-4 text-foreground [background-image:var(--gradient-aurora)] [&_svg]:size-8" aria-hidden>
            {icon}
          </div>
          <div className="min-w-0 flex-1 basis-64 space-y-2">
            {eyebrow && <p className="text-sm text-muted-foreground wrap-anywhere">{eyebrow}</p>}
            <h1 className="text-3xl font-semibold wrap-anywhere sm:text-4xl">{title}</h1>
            {description && (
              <p className={descriptionMono ? 'font-mono text-sm text-muted-foreground wrap-anywhere' : 'max-w-150 text-base text-muted-foreground wrap-anywhere'}>{description}</p>
            )}
            {(badges.length > 0 || status) && (
              <ul className="flex flex-wrap gap-2 pt-1" aria-label="Tags">
                {badges.map((badge) => (
                  <li key={badge.label} className="min-w-0 max-w-full"><Badge variant={decorativeVariantFor(badge.label)} background className="max-w-full" title={`${badge.label}: ${badge.value}`}><span className="truncate"><span className="sr-only">{badge.label}: </span>{badge.value}</span></Badge></li>
                ))}
                {status && <li>{status}</li>}
              </ul>
            )}
            {location && <p className="flex items-start gap-1 pt-1 text-sm text-muted-foreground"><IconMapPin size={ICON_SIZE_INLINE_PX} aria-hidden className="mt-0.5 shrink-0" /><span className="min-w-0 wrap-anywhere">{location}</span></p>}
          </div>
        </CardContent>
        <dl aria-label="At a glance" className="grid grid-cols-3 divide-x divide-border border-t border-border bg-background">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 px-4 py-3 sm:px-6">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-2xl font-semibold">{stat.value ?? <><span aria-hidden>…</span><span className="sr-only">Loading</span></>}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>
    </m.div>
  );
}
