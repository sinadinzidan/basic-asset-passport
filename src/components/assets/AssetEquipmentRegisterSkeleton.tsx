import { Skeleton } from '@cognite/aura/components/skeleton';

import { HudPanel } from '../general/HudPanel';

const TAB_COUNT = 5;
const PROPERTY_CELL_COUNT = 6;

/**
 * The asset page while its details load: the same shapes as the loaded page (kicker, title with badges, a tab
 * bar over a card of properties) so nothing jumps when the content arrives.
 */
export function AssetEquipmentRegisterSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">Loading asset and equipment properties...</span>
      <div aria-hidden className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        <HudPanel bodyClassName="hud-flush">
          <div className="flex items-center gap-6 border-b px-4 py-3">
            {Array.from({ length: TAB_COUNT }, (_, index) => (
              <Skeleton
                key={index}
                className="h-4 w-20"
                data-skeleton-tab
              />
            ))}
          </div>
          <div className="p-4">
            <div className="data-card">
              <header className="data-card__header">
                <Skeleton className="h-6 w-44" />
              </header>
              <dl className="property-grid">
                {Array.from({ length: PROPERTY_CELL_COUNT }, (_, index) => (
                  <div key={index} className="property-cell flex flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-36 max-w-full" />
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </HudPanel>
      </div>
    </div>
  );
}
