import { Skeleton } from '@cognite/aura/components/skeleton';
import { useId } from 'react';

import {
  TIMESERIES_PREVIEW_LOADING_LABEL,
  TIMESERIES_PREVIEW_MESSAGES,
  TREND_WINDOW_LABEL,
} from '../../../constants/timeseries';
import { TimeseriesPreviewKind } from '../../../enums/timeseriesPreviewKind';
import { buildSparkline, formatTrendValue, summarizeTrend } from '../../../lib/timeseriesTrend';
import type { TimeseriesPreview as Preview } from '../../../types/timeseries';

const CHART_SIZE = { width: 320, height: 104, padding: 8 };

const STAT_COUNT = 4;

type TimeseriesPreviewProps = {
  preview: Preview;
  unit: string | null;
};

export function TimeseriesPreview({ preview, unit }: TimeseriesPreviewProps) {
  const gradientId = useId();

  if (preview.kind === TimeseriesPreviewKind.LOADING) {
    return (
      <div
        className="timeseries-preview"
        aria-busy="true"
        aria-label={TIMESERIES_PREVIEW_LOADING_LABEL}
      >
        <Skeleton className="h-[6.5rem] w-full" />
        <div className="timeseries-preview__stats">
          {Array.from({ length: STAT_COUNT }, (_item, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (preview.kind !== TimeseriesPreviewKind.READY) {
    return (
      <p className="timeseries-preview timeseries-preview--message">
        {TIMESERIES_PREVIEW_MESSAGES[preview.kind]}
      </p>
    );
  }

  const drawing = buildSparkline(preview.points, CHART_SIZE);
  const summary = summarizeTrend(preview.points);

  if (drawing === null || summary === null) return null;

  const suffix = unit ? ` ${unit}` : '';
  const stats = [
    { label: 'Latest', value: summary.latest, isHighlighted: true },
    { label: 'Min', value: summary.minimum, isHighlighted: false },
    { label: 'Max', value: summary.maximum, isHighlighted: false },
    { label: 'Avg', value: summary.average, isHighlighted: false },
  ];

  return (
    <div className="timeseries-preview">
      <svg
        className="trend-chart"
        role="img"
        aria-label={`Last ${TREND_WINDOW_LABEL}: latest ${formatTrendValue(summary.latest)}${suffix}, from ${formatTrendValue(summary.minimum)} to ${formatTrendValue(summary.maximum)}${suffix}`}
        viewBox={`0 0 ${CHART_SIZE.width} ${CHART_SIZE.height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop className="trend-chart__stop-top" offset="0" />
            <stop className="trend-chart__stop-bottom" offset="1" />
          </linearGradient>
        </defs>
        {drawing.gridLines.map((gridLineY) => (
          <line
            key={gridLineY}
            className="trend-chart__grid"
            x1={CHART_SIZE.padding}
            x2={CHART_SIZE.width - CHART_SIZE.padding}
            y1={gridLineY}
            y2={gridLineY}
          />
        ))}
        <path d={drawing.areaPath} fill={`url(#${gradientId})`} />
        <path className="trend-chart__line" d={drawing.linePath} />
        <circle
          className="trend-chart__halo"
          cx={drawing.lastPoint.x}
          cy={drawing.lastPoint.y}
          r="7"
        />
        <circle
          className="trend-chart__dot"
          cx={drawing.lastPoint.x}
          cy={drawing.lastPoint.y}
          r="3.5"
        />
      </svg>
      <div className="timeseries-preview__range" aria-hidden>
        <span>{`${TREND_WINDOW_LABEL} ago`}</span>
        <span>Now</span>
      </div>
      <dl className="timeseries-preview__stats">
        {stats.map(({ label, value, isHighlighted }) => (
          <div key={label} className="timeseries-preview__stat" data-highlighted={isHighlighted}>
            <dt>{label}</dt>
            <dd>
              {formatTrendValue(value)}
              {unit ? <span className="timeseries-preview__unit">{unit}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
