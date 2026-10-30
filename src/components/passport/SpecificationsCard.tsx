import { CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderStart, CardTitle } from '@cognite/aura/components/card';
import { IconListDetails } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import type { AssetPassportRecord } from '../../types/passport';
import { IconTile } from '../general/IconTile';
import { StateMessage } from '../general/StateMessage';
import { SurfaceCard } from '../general/SurfaceCard';

type EmptyState = { title: string; description: string; action?: ReactNode };

const NO_SPECIFICATIONS: EmptyState = { title: 'No specifications available', description: 'This equipment has no readable properties in CDF.' };

/** The Overview card. When there is nothing to show it keeps its header and shows the empty state inside, like every other card. */
export function SpecificationsCard({ specifications, empty = NO_SPECIFICATIONS }: { specifications: AssetPassportRecord['specifications']; empty?: EmptyState }) {
  return (
    <SurfaceCard>
      <CardHeader>
        <CardHeaderStart><IconTile tone="fjord"><IconListDetails /></IconTile></CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h2">Identity &amp; specifications</CardTitle>
          <CardDescription>Properties read from the equipment record in CDF</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="items-stretch">
        {specifications.length === 0
          ? <StateMessage compact type="no-results" title={empty.title} description={empty.description} action={empty.action} />
          : (
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <dl className="-mr-px -mb-px grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                {specifications.map((specification, index) => (
                  <div key={`${index}:${specification.label}`} className="min-w-0 border-r border-b border-border bg-background p-4">
                    <dt className="text-xs text-muted-foreground">{specification.label}</dt>
                    <dd className="text-sm font-medium wrap-anywhere">{specification.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
      </CardContent>
    </SurfaceCard>
  );
}
