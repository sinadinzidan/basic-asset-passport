import { Separator } from '@cognite/aura/components/separator';
import { IconPlayerPlay, IconRulerMeasure } from '@tabler/icons-react';

import type { ChartRange } from '../../enums/monitoring';
import type { ChartTimeRange } from '../../types/timeSeriesChart';

import { MarkerReadingMenu } from './MarkerReadingMenu';
import { TimeRangeControl } from './TimeRangeControl';
import { ToolbarToggle } from './ToolbarToggle';

export interface ChartToolbarProperties {
  window: ChartTimeRange;
  nowMs: number;
  isMarkerMode: boolean;
  isLive: boolean;
  isInterpolated: boolean;
  onRangeChange: (range: ChartRange) => void;
  onWindowChange: (window: ChartTimeRange) => void;
  onMarkerModeToggle: () => void;
  onLiveToggle?: () => void;
  onInterpolatedChange: (isInterpolated: boolean) => void;
}

export function ChartToolbar(properties: ChartToolbarProperties) {
  return (
    <div
      role="toolbar"
      aria-label="Chart tools"
      className="flex flex-wrap items-center gap-x-2 gap-y-2"
    >
      <div role="group" aria-label="Explore" className="flex items-center gap-1.5">
        <ToolbarToggle
          label="Vertical marker"
          icon={IconRulerMeasure}
          isActive={properties.isMarkerMode}
          onClick={properties.onMarkerModeToggle}
        />
        {properties.onLiveToggle ? (
          <ToolbarToggle
            label="Play the live feed (simulated)"
            icon={IconPlayerPlay}
            isActive={properties.isLive}
            isRunningTone
            onClick={properties.onLiveToggle}
          />
        ) : null}
        {properties.isMarkerMode ? (
          <MarkerReadingMenu
            isInterpolated={properties.isInterpolated}
            onChange={properties.onInterpolatedChange}
          />
        ) : null}
      </div>
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-6 sm:block"
      />
      <TimeRangeControl
        window={properties.window}
        nowMs={properties.nowMs}
        onRangeChange={properties.onRangeChange}
        onWindowChange={properties.onWindowChange}
      />
    </div>
  );
}
