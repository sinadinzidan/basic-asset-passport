import { CardContent, CardHeader, CardHeaderCenter, CardHeaderStart, CardTitle } from '@cognite/aura/components/card';
import { IconKey } from '@tabler/icons-react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';

import { HIGHLIGHT_TILE_CLASSES } from '../../lib/decorative';
import { keyFactsOf } from '../../lib/keyFacts';
import { revealMotion } from '../../lib/motion';
import type { AssetPassportRecord } from '../../types/passport';
import { IconTile } from '../general/IconTile';
import { SurfaceCard } from '../general/SurfaceCard';

export function KeyFactsCard({ specifications }: { specifications: AssetPassportRecord['specifications'] }) {
  const reduceMotion = useReducedMotion();

  const facts = keyFactsOf(specifications);

  if (facts.length === 0) return null;

  return (
    <SurfaceCard>
      <CardHeader><CardHeaderStart><IconTile tone="aurora"><IconKey /></IconTile></CardHeaderStart><CardHeaderCenter><CardTitle as="h2">Key facts</CardTitle></CardHeaderCenter></CardHeader>
      <CardContent className="items-stretch">
        <dl className="grid gap-3">
          {facts.map((fact, index) => (
            <m.div key={`${index}:${fact.label}`} {...revealMotion(index + 1, reduceMotion)}
              className={`min-w-0 rounded-xl p-3 ${HIGHLIGHT_TILE_CLASSES[index % HIGHLIGHT_TILE_CLASSES.length]}`}>
              <dt className="text-xs font-medium">{fact.label}</dt>
              <dd className="text-lg font-semibold wrap-anywhere">{fact.value}</dd>
            </m.div>
          ))}
        </dl>
      </CardContent>
    </SurfaceCard>
  );
}
