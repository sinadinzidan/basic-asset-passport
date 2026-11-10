import { Button } from '@cognite/aura/components/button';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { CHART_OVERLAY_DESCRIPTIONS, CHART_OVERLAY_LABELS } from '../../../constants/timeSeriesChart';
import { ChartOverlay } from '../../../enums/timeSeriesChart';
import { cn } from '../../../lib/utils';
import type { ChartSeriesView } from '../../../types/timeSeriesChart';
import { SWITCH_CLASSES } from '../../general/forms/fieldStyles';
import { SwitchField } from '../../general/forms/SwitchField';
import { StateMessage } from '../../general/StateMessage';

import { PanelSection } from './PanelSection';
import { SeriesLabel } from './SeriesLabel';

type MoveOffset = -1 | 1;

interface LayersPanelProps {
  series: readonly ChartSeriesView[];
  overlays: readonly ChartOverlay[];
  onVisibilityChange: (seriesId: string, isVisible: boolean) => void;
  onMove: (seriesId: string, offset: -1 | 1) => void;
  onToggleOverlay: (overlay: ChartOverlay) => void;
}

const OVERLAY_ORDER: readonly ChartOverlay[] = Object.values(ChartOverlay);

function isDisabledElement(element: HTMLElement): boolean {
  return element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}

function moveKey(seriesId: string, offset: MoveOffset): string {
  return `${seriesId}:${offset}`;
}

/**
 * The layers of the chart: the series in the order they are drawn, each with a visibility toggle and move up / move down
 * buttons, and the overlays with a switch each. Reordering is done with the buttons, so it works from the keyboard; the focus
 * follows the moved series and a short live message says where it went.
 */
export function LayersPanel({ series, overlays, onVisibilityChange, onMove, onToggleOverlay }: LayersPanelProps) {
  const [announcement, setAnnouncement] = useState('');
  const moveButtons = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<{ seriesId: string; offset: MoveOffset } | undefined>(undefined);

  const handleMove = (seriesId: string, offset: MoveOffset): void => {
    const index = series.findIndex((entry) => entry.configuration.seriesId === seriesId);
    const moved = series[index];
    if (!moved) return;
    pendingFocus.current = { seriesId, offset };
    setAnnouncement(`${moved.definition.name} moved to position ${index + offset + 1} of ${series.length}`);
    onMove(seriesId, offset);
  };

  // After a move the row sits somewhere else; keep the keyboard on the same series, on the opposite button once the end is reached.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = undefined;
    const preferred = moveButtons.current.get(moveKey(pending.seriesId, pending.offset));
    const opposite = moveButtons.current.get(moveKey(pending.seriesId, pending.offset === 1 ? -1 : 1));
    (preferred && !isDisabledElement(preferred) ? preferred : opposite)?.focus();
  }, [series]);

  const registerMoveButton = (seriesId: string, offset: MoveOffset) => (element: HTMLElement | null) => {
    if (element) moveButtons.current.set(moveKey(seriesId, offset), element);
    else moveButtons.current.delete(moveKey(seriesId, offset));
  };

  return (
    <>
      <PanelSection title="Series">
        {series.length === 0 ? (
          <StateMessage size="inline" title="No series on the chart" description="Add data to see its layers here." />
        ) : (
          <ul aria-label="Series layers" className="flex flex-col divide-y divide-border">
            {series.map((entry, index) => {
              const seriesId = entry.configuration.seriesId;
              const name = entry.definition.name;
              const isVisible = entry.configuration.isVisible;
              return (
                <li key={seriesId} className="flex items-center justify-between gap-2 py-1.5">
                  <div className={cn('flex min-w-0 flex-1 items-center gap-2', !isVisible && 'opacity-60')}>
                    <SeriesLabel series={entry} />
                    {isVisible ? null : <span className="shrink-0 text-xs text-muted-foreground">Hidden</span>}
                  </div>
                  <div className="chart-row-actions flex shrink-0 items-center gap-1">
                    <Switch
                      className={SWITCH_CLASSES}
                      checked={isVisible}
                      aria-label={`Show ${name} on the chart`}
                      onCheckedChange={(next) => onVisibilityChange(seriesId, next)}
                    />
                    <Button
                      ref={registerMoveButton(seriesId, -1)}
                      variant="ghost"
                      size="icon-sm"
                      className="size-7"
                      aria-label={`Move ${name} up`}
                      disabled={index === 0}
                      onClick={() => handleMove(seriesId, -1)}
                    >
                      <IconArrowUp size={16} aria-hidden />
                    </Button>
                    <Button
                      ref={registerMoveButton(seriesId, 1)}
                      variant="ghost"
                      size="icon-sm"
                      className="size-7"
                      aria-label={`Move ${name} down`}
                      disabled={index === series.length - 1}
                      onClick={() => handleMove(seriesId, 1)}
                    >
                      <IconArrowDown size={16} aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </PanelSection>

      <PanelSection title="Overlays">
        <ul aria-label="Overlays" className="flex flex-col divide-y divide-border">
          {OVERLAY_ORDER.map((overlay) => (
            <li key={overlay} className="py-2.5 first:pt-0 last:pb-0">
              <SwitchField
                label={CHART_OVERLAY_LABELS[overlay]}
                description={CHART_OVERLAY_DESCRIPTIONS[overlay]}
                checked={overlays.includes(overlay)}
                onChange={() => onToggleOverlay(overlay)}
              />
            </li>
          ))}
        </ul>
      </PanelSection>
    </>
  );
}
