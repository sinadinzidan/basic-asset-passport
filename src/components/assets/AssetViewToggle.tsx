import { SegmentedControl, SegmentedControlButton, SegmentedControlIndicator, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';

import { ASSET_VIEW_LABELS } from '../../constants/labels';
import { AssetView } from '../../enums/assetView';
import { isEnumValue } from '../../lib/enumGuards';

export function AssetViewToggle({ view, onViewChange }: { view: AssetView; onViewChange: (view: AssetView) => void }) {
  return (
    <SegmentedControl value={view} onValueChange={(value) => { if (isEnumValue(AssetView, value)) onViewChange(value); }}>
      <SegmentedControlList aria-label="Asset view" className="border border-border-emphasized">
        <SegmentedControlIndicator />
        <SegmentedControlButton value={AssetView.LIST} tabContent="icon-only" aria-label={ASSET_VIEW_LABELS[AssetView.LIST]} title={ASSET_VIEW_LABELS[AssetView.LIST]}><IconList aria-hidden /></SegmentedControlButton>
        <SegmentedControlButton value={AssetView.GRID} tabContent="icon-only" aria-label={ASSET_VIEW_LABELS[AssetView.GRID]} title={ASSET_VIEW_LABELS[AssetView.GRID]}><IconLayoutGrid aria-hidden /></SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}
