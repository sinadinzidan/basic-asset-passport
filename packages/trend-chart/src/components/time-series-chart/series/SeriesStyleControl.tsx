import { Button } from '@cognite/aura/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import type { ReactNode } from 'react';

import { HALF } from '../../../constants/mathConstants';
import {
  CHART_COLOR_PALETTE,
  CHART_LINE_WIDTHS,
  LINE_STYLE_DASH_ARRAYS,
  LINE_STYLE_LABELS,
} from '../../../constants/timeSeriesChart';
import { LineStyle } from '../../../enums/timeSeriesChart';
import type { SeriesStyle } from '../../../types/timeSeriesChart';

import { TooltipTarget } from './TooltipTarget';

const PREVIEW_WIDTH = 28;
const PREVIEW_HEIGHT = 12;
const PREVIEW_PADDING = 2;

function LinePreview({ style }: { style: SeriesStyle }) {
  const middle = PREVIEW_HEIGHT * HALF;
  return (
    <svg width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} aria-hidden className="shrink-0">
      <line
        x1={PREVIEW_PADDING}
        y1={middle}
        x2={PREVIEW_WIDTH - PREVIEW_PADDING}
        y2={middle}
        stroke={style.color}
        strokeWidth={style.lineWidth}
        strokeDasharray={LINE_STYLE_DASH_ARRAYS[style.lineStyle]}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

interface SeriesStyleControlProperties {
  seriesName: string;
  style: SeriesStyle;
  onStyleChange: (style: Partial<SeriesStyle>) => void;
}

/**
 * The swatch of a series, drawn from the style the plot uses, so table and plot cannot disagree. It opens the choices of
 * colour, line width and line style; a choice applies at once.
 */
export function SeriesStyleControl({
  seriesName,
  style,
  onStyleChange,
}: SeriesStyleControlProperties) {
  const label = `Style of ${seriesName}`;
  return (
    <Popover>
      <TooltipTarget text={label}>
        <PopoverTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={label} className="w-9" />}
        >
          <LinePreview style={style} />
        </PopoverTrigger>
      </TooltipTarget>
      <PopoverContent align="start" className="flex w-72 flex-col gap-3">
        <ChoiceGroup label="Colour">
          {CHART_COLOR_PALETTE.map((color, position) => (
            <Button
              key={color}
              variant={style.color === color ? 'secondary' : 'ghost'}
              size="icon-sm"
              aria-label={`Colour ${position + 1}`}
              aria-pressed={style.color === color}
              onClick={() => onStyleChange({ color })}
            >
              <span
                aria-hidden
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            </Button>
          ))}
        </ChoiceGroup>
        <ChoiceGroup label="Line width">
          {CHART_LINE_WIDTHS.map((lineWidth) => (
            <Button
              key={lineWidth}
              variant={style.lineWidth === lineWidth ? 'secondary' : 'outline'}
              size="sm"
              aria-label={`Line width ${lineWidth} pixels`}
              aria-pressed={style.lineWidth === lineWidth}
              onClick={() => onStyleChange({ lineWidth })}
            >
              <LinePreview style={{ ...style, lineWidth, lineStyle: LineStyle.SOLID }} />
              <span className="tabular-nums text-xs">{lineWidth}</span>
            </Button>
          ))}
        </ChoiceGroup>
        <ChoiceGroup label="Line style">
          {Object.values(LineStyle).map((lineStyle) => (
            <Button
              key={lineStyle}
              variant={style.lineStyle === lineStyle ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={style.lineStyle === lineStyle}
              onClick={() => onStyleChange({ lineStyle })}
            >
              <LinePreview style={{ ...style, lineStyle }} />
              {LINE_STYLE_LABELS[lineStyle]}
            </Button>
          ))}
        </ChoiceGroup>
      </PopoverContent>
    </Popover>
  );
}
