import { Skeleton } from '@cognite/aura/components/skeleton';

import { ASSET_DETAILS_LOADING_MESSAGE } from '../../constants/assets';
import { HudShape } from '../../enums/hudShape';
import { HudPanel } from '../general';

const TAB_COUNT = 5;
const PROPERTY_CELL_COUNT = 6;

export function AssetDetailsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{ASSET_DETAILS_LOADING_MESSAGE}</span>
      <div aria-hidden className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-72 max-w-full" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>
        <HudPanel shape={HudShape.SCREEN} bodyClassName="hud-flush">
          <div className="flex items-center gap-6 border-b px-4 py-3">
            {Array.from({ length: TAB_COUNT }, (_item, index) => (
              <div key={index} className="flex items-center gap-2" data-skeleton-tab>
                <Skeleton className="h-4 w-16" />
                {index === 0 ? null : <Skeleton className="h-5 w-6" data-skeleton-tab-badge />}
              </div>
            ))}
          </div>
          <div className="p-4">
            <div className="data-card">
              <header className="data-card__header">
                <Skeleton className="h-6 w-44" />
              </header>
              <dl className="property-grid">
                {Array.from({ length: PROPERTY_CELL_COUNT }, (_item, index) => (
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
