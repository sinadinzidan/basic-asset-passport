import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { CHART_SIDEBAR_TRANSITION_MS, CHART_SIDEBAR_WIDTH_PX } from '../../../constants/timeSeriesChart';
import type { ChartPanel } from '../../../enums/timeSeriesChart';
import { useChartTimers } from '../../../hooks/time-series-chart/useChartTimers';

import { ChartSidebar } from './ChartSidebar';

interface ChartSidebarSlotProps {
  panel: ChartPanel | undefined;
  assistantLabel?: string;
  onClose: () => void;
  /** The body of a panel. It is called for the panel still on screen while the sidebar slides shut. */
  renderPanel: (panel: ChartPanel) => ReactNode;
}

/** The width is a custom property so the constant, not a literal, sets it; the stylesheet reads it on wide screens. */
/** While it slides shut the sidebar can no longer be focused, clicked or read out; React 18's types do not know `inert`, so it is spread in. */
const INERT = { inert: '', 'aria-hidden': true };

const SLOT_STYLE: CSSProperties & Record<`--${string}`, string> = {
  '--chart-sidebar-width': `${CHART_SIDEBAR_WIDTH_PX}px`,
};

/**
 * The place of the sidebar beside the chart: the sidebar slides in and out instead of appearing, and the panel it is closing stays on screen
 * until it is gone. The room it takes is given and taken back once, not animated, so the plot is not redrawn on every frame. Another panel
 * replaces the content directly. While it is shut nothing of it is in the page.
 */
export function ChartSidebarSlot({ panel, assistantLabel, onClose, renderPanel }: ChartSidebarSlotProps) {
  const timers = useChartTimers();
  const [shown, setShown] = useState(panel);
  if (panel !== undefined && panel !== shown) setShown(panel);

  useEffect(() => {
    if (panel !== undefined) return undefined;
    const handle = timers.setTimeout(() => setShown(undefined), CHART_SIDEBAR_TRANSITION_MS);
    return () => timers.clearTimeout(handle);
  }, [panel, timers]);

  if (shown === undefined) return null;
  const isClosing = panel === undefined;
  return (
    <div
      className="chart-sidebar-slot"
      data-state={isClosing ? 'closing' : 'open'}
      style={SLOT_STYLE}
      {...(isClosing ? INERT : {})}
    >
      <ChartSidebar panel={shown} assistantLabel={assistantLabel} onClose={onClose}>
        {renderPanel(shown)}
      </ChartSidebar>
    </div>
  );
}
