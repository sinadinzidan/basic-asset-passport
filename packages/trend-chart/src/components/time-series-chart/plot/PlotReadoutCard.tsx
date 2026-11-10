import type { ReadoutRow } from '../../../lib/time-series-chart/plotReadouts';

import { HOVER_CARD_WIDTH_PX } from './plotLayout';

interface PlotReadoutCardProps {
  title: string;
  rows: readonly ReadoutRow[];
  anchorX: number;
  top: number;
  isOnLeft: boolean;
  testId: string;
  /** The marker's readout is announced when it changes, so a keyboard user hears the values. */
  isAnnounced?: boolean;
}

const CARD_OFFSET_PX = 12;

export function PlotReadoutCard({
  title,
  rows,
  anchorX,
  top,
  isOnLeft,
  testId,
  isAnnounced = false,
}: PlotReadoutCardProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-xl border border-border bg-popover-background px-3 py-2 text-xs"
      style={{
        top,
        left: isOnLeft ? anchorX - HOVER_CARD_WIDTH_PX - CARD_OFFSET_PX : anchorX + CARD_OFFSET_PX,
        width: HOVER_CARD_WIDTH_PX,
      }}
      data-testid={testId}
      aria-live={isAnnounced ? 'polite' : undefined}
    >
      <p className="mb-1.5 font-semibold text-foreground">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li
            key={row.seriesId}
            className="flex flex-col gap-0.5"
            data-testid="readout-row"
            data-series={row.seriesId}
            data-kind={row.kind}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
                <span className="truncate text-muted-foreground">{row.label}</span>
              </span>
              <span className="tabular-nums shrink-0 font-medium text-foreground">{row.value}</span>
            </span>
            {row.detail ? <span className="pl-3.5 text-[11px] text-muted-foreground">{row.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
