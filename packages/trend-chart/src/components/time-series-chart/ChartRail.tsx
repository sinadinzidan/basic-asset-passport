import {
  IconAdjustmentsHorizontal,
  IconAlertTriangle,
  IconAxisY,
  IconChartAreaLine,
  IconGauge,
  IconLayersSubtract,
  IconPhotoDown,
  IconSparkles,
  IconTarget,
} from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

import { ASSISTANT_PANEL_LABEL, CHART_PANEL_LABELS } from '../../constants/timeSeriesChart';
import { ChartPanel } from '../../enums/timeSeriesChart';

import { ToolbarToggle } from './ToolbarToggle';

interface RailItem {
  panel: ChartPanel;
  icon: Icon;
}

const APPEARANCE_PANELS: readonly RailItem[] = [
  { panel: ChartPanel.LAYERS, icon: IconLayersSubtract },
  { panel: ChartPanel.DISPLAY, icon: IconAdjustmentsHorizontal },
  { panel: ChartPanel.AXES, icon: IconAxisY },
];

const ANALYSIS_PANELS: readonly RailItem[] = [
  { panel: ChartPanel.ALERTING, icon: IconAlertTriangle },
  { panel: ChartPanel.MONITORING, icon: IconGauge },
  { panel: ChartPanel.THRESHOLDS, icon: IconTarget },
  { panel: ChartPanel.DATA_PROFILING, icon: IconChartAreaLine },
];

const ASSISTANT_PANELS: readonly RailItem[] = [{ panel: ChartPanel.ASSISTANT, icon: IconSparkles }];

interface ChartRailProps {
  panel: ChartPanel | undefined;
  onPanelToggle: (panel: ChartPanel) => void;
  /** The name of the assistant panel, when the host gives one; the rail shows no assistant button without it. */
  assistantLabel?: string;
  onDownloadImage?: () => void;
  isDownloadDisabled?: boolean;
}

export function ChartRail({
  panel,
  onPanelToggle,
  assistantLabel,
  onDownloadImage,
  isDownloadDisabled = false,
}: ChartRailProps) {
  const groups: ReadonlyArray<{ label: string; items: readonly RailItem[] }> = [
    { label: 'Appearance', items: APPEARANCE_PANELS },
    { label: 'Analysis', items: ANALYSIS_PANELS },
    ...(assistantLabel !== undefined ? [{ label: ASSISTANT_PANEL_LABEL, items: ASSISTANT_PANELS }] : []),
  ];
  return (
    <div
      role="group"
      aria-label="Panels"
      className="flex shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border px-4 py-2 lg:order-last lg:flex-col lg:flex-nowrap lg:items-center lg:gap-y-3 lg:border-b-0 lg:border-l lg:p-2"
    >
      {groups.map((group) => (
        <div
          key={group.label}
          role="group"
          aria-label={group.label}
          className="flex flex-row items-center gap-1.5 lg:flex-col"
        >
          {group.items.map(({ panel: railPanel, icon }) => (
            <ToolbarToggle
              key={railPanel}
              label={
                railPanel === ChartPanel.ASSISTANT
                  ? (assistantLabel ?? ASSISTANT_PANEL_LABEL)
                  : CHART_PANEL_LABELS[railPanel]
              }
              icon={icon}
              isActive={panel === railPanel}
              onClick={() => onPanelToggle(railPanel)}
            />
          ))}
        </div>
      ))}
      {onDownloadImage ? (
        <div role="group" aria-label="Download" className="flex flex-row items-center gap-1.5 lg:flex-col">
          <ToolbarToggle
            label="Download image"
            icon={IconPhotoDown}
            isDisabled={isDownloadDisabled}
            onClick={onDownloadImage}
          />
        </div>
      ) : null}
    </div>
  );
}
