import { describe, expect, it } from 'vitest';

import { CHART_MAX_BUCKETS, MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { ChartMode } from '../../../enums/monitoring';
import { LineStyle, ThresholdLevel, ThresholdSide } from '../../../enums/timeSeriesChart';
import {
  createDefinition,
  createPoint,
  createPoints,
  createSeriesView,
  createThreshold,
} from '../../../mocks/chartData';
import type { ChartSeriesView, TimeSeriesPoint } from '../../../types/timeSeriesChart';
import { buildPlotModel, PLOT_TOP_PX } from '../../monitoring/plotModel';
import {
  bucketAt,
  bucketsOfBreach,
  buildPlotSeries,
  laneYPosition,
  limitValuesOf,
  plotBuckets,
  seriesLabel,
} from '../plotSeries';
import type { PlotSeries } from '../plotSeries';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const SECOND_MS = 1000;
const TEN_MINUTES = { start: 0, end: 10 * MINUTE_MS };
const EVERYTHING_ON = { shouldShowMinMax: true, shouldShowThresholds: true };
const PLOT_HEIGHT_PX = 270;

describe(seriesLabel.name, () => {
  it('is the name of the series', () => {
    expect(seriesLabel(createSeriesView())).toBe('Discharge pressure');
  });

  it('is the tag when the series has no name', () => {
    expect(seriesLabel(createSeriesView({ definition: createDefinition({ name: '' }) }))).toBe(
      'PT-101',
    );
  });

  it('is the id when the series has neither a name nor a tag', () => {
    expect(
      seriesLabel(createSeriesView({ definition: createDefinition({ name: '', tag: '' }) })),
    ).toBe('s1');
  });
});

describe(plotBuckets.name, () => {
  it('keeps one bucket per reading for sparse data', () => {
    const { buckets, isAggregated } = plotBuckets(createPoints([1, 2, 3]), TEN_MINUTES);

    expect(buckets.map((bucket) => bucket.average)).toEqual([1, 2, 3]);
    expect(isAggregated).toBe(false);
  });

  it('puts an empty bucket into an interval much longer than the typical step, so the line breaks there', () => {
    const points = [0, 1, 2, 3, 10].map((minute) => createPoint(minute * MINUTE_MS, 1));

    const { buckets } = plotBuckets(points, { start: 0, end: 20 * MINUTE_MS });

    expect(buckets).toHaveLength(6);
    expect(buckets[4]).toEqual({
      atMs: 6.5 * MINUTE_MS,
      average: null,
      minimum: null,
      maximum: null,
      goodCount: 0,
      flaggedCount: 0,
    });
  });

  it('leaves a single reading as it is, with no step to judge a gap by', () => {
    const { buckets } = plotBuckets(createPoints([1]), TEN_MINUTES);

    expect(buckets).toHaveLength(1);
  });

  it('aggregates dense data down to the bucket limit', () => {
    const { buckets, isAggregated } = plotBuckets(densePoints(), denseWindow());

    expect(isAggregated).toBe(true);
    expect(buckets).toHaveLength(CHART_MAX_BUCKETS);
  });
});

describe(buildPlotSeries.name, () => {
  it('carries the identity, the unit and the line style of the series', () => {
    const series = buildPlotSeries(
      createSeriesView({ points: createPoints([1, 5, 3]) }),
      TEN_MINUTES,
      EVERYTHING_ON,
    );

    expect(series).toMatchObject({
      id: 's1',
      label: 'Discharge pressure',
      unit: 'bar',
      color: 'var(--chart-1)',
      lineWidth: 1.5,
      dashArray: undefined,
      isAggregated: false,
      hasValues: true,
      stepMs: MINUTE_MS,
    });
  });

  it('draws a dashed series with dashes', () => {
    const view = createSeriesView({
      configuration: {
        seriesId: 's1',
        isVisible: true,
        style: { color: 'var(--chart-2)', lineWidth: 2, lineStyle: LineStyle.DASHED },
      },
    });

    expect(buildPlotSeries(view, TEN_MINUTES, EVERYTHING_ON).dashArray).toBe('7 4');
  });

  it('marks the lowest and the highest reading when the minimum and maximum are shown', () => {
    const series = buildPlotSeries(
      createSeriesView({ points: createPoints([1, 5, 3]) }),
      TEN_MINUTES,
      EVERYTHING_ON,
    );

    expect(series.min).toEqual(createPoint(0, 1));
    expect(series.max).toEqual(createPoint(MINUTE_MS, 5));
  });

  it('marks neither when the minimum and maximum are hidden', () => {
    const view = createSeriesView({ points: createPoints([1, 5, 3]) });

    const series = buildPlotSeries(view, TEN_MINUTES, {
      shouldShowMinMax: false,
      shouldShowThresholds: true,
    });

    expect(series.min).toBeUndefined();
    expect(series.max).toBeUndefined();
  });

  it('finds where the series went beyond its thresholds', () => {
    const threshold = createThreshold({ value: 4 });
    const view = createSeriesView({ points: createPoints([1, 5, 6, 3]), thresholds: [threshold] });

    const series = buildPlotSeries(view, TEN_MINUTES, EVERYTHING_ON);

    expect(series.thresholds).toEqual([threshold]);
    expect(series.breaches).toEqual([{ threshold, from: MINUTE_MS, to: 2 * MINUTE_MS, peak: 6 }]);
  });

  it('has no thresholds and no breaches when the thresholds are hidden', () => {
    const view = createSeriesView({
      points: createPoints([1, 5, 3]),
      thresholds: [createThreshold({ value: 4 })],
    });

    const series = buildPlotSeries(view, TEN_MINUTES, {
      shouldShowMinMax: true,
      shouldShowThresholds: false,
    });

    expect(series.thresholds).toEqual([]);
    expect(series.breaches).toEqual([]);
  });

  it('draws a reference line without counting breaches of it', () => {
    const reference = createThreshold({ value: 4, isReference: true });
    const view = createSeriesView({ points: createPoints([1, 5, 3]), thresholds: [reference] });

    const series = buildPlotSeries(view, TEN_MINUTES, EVERYTHING_ON);

    expect(series.thresholds).toEqual([reference]);
    expect(series.breaches).toEqual([]);
  });

  it('has no values when no reading in the window is valid', () => {
    const series = buildPlotSeries(
      createSeriesView({ points: createPoints([null, null]) }),
      TEN_MINUTES,
      EVERYTHING_ON,
    );

    expect(series.hasValues).toBe(false);
  });

  it('takes a hundredth of the window for the step when the readings give none', () => {
    const series = buildPlotSeries(
      createSeriesView({ points: [] }),
      { start: 0, end: 100 * MINUTE_MS },
      EVERYTHING_ON,
    );

    expect(series.stepMs).toBe(MINUTE_MS);
  });

  it('takes the width of a bucket for the step when the data is aggregated', () => {
    const series = buildPlotSeries(
      createSeriesView({ points: densePoints() }),
      denseWindow(),
      EVERYTHING_ON,
    );

    expect(series.stepMs).toBe((denseWindow().end - denseWindow().start) / CHART_MAX_BUCKETS);
  });
});

describe(limitValuesOf.name, () => {
  it('names each threshold by its level and side', () => {
    const thresholds = [
      createThreshold({ level: ThresholdLevel.ALERT, side: ThresholdSide.UPPER, value: 8 }),
      createThreshold({ level: ThresholdLevel.DANGER, side: ThresholdSide.UPPER, value: 10 }),
      createThreshold({ level: ThresholdLevel.ALERT, side: ThresholdSide.LOWER, value: 2 }),
      createThreshold({ level: ThresholdLevel.DANGER, side: ThresholdSide.LOWER, value: 1 }),
    ];

    expect(limitValuesOf(thresholds)).toEqual({
      alertHigh: 8,
      dangerHigh: 10,
      alertLow: 2,
      dangerLow: 1,
    });
  });

  it('keeps the outermost of two thresholds of the same level and side', () => {
    const thresholds = [
      createThreshold({ side: ThresholdSide.UPPER, value: 8 }),
      createThreshold({ side: ThresholdSide.UPPER, value: 9 }),
      createThreshold({ side: ThresholdSide.LOWER, value: 2 }),
      createThreshold({ side: ThresholdSide.LOWER, value: 1 }),
    ];

    expect(limitValuesOf(thresholds)).toEqual({ alertHigh: 9, alertLow: 1 });
  });

  it('has no limits without thresholds', () => {
    expect(limitValuesOf([])).toEqual({});
  });
});

describe(bucketsOfBreach.name, () => {
  it('gives the buckets from the start to the end of the breach', () => {
    const series = breachedSeries(createPoints([1, 9, 9, 1]));
    const breach = {
      threshold: createThreshold({ value: 4 }),
      from: MINUTE_MS,
      to: 2 * MINUTE_MS,
      peak: 9,
    };

    const buckets = bucketsOfBreach(series, breach, TEN_MINUTES);

    expect(buckets.map((bucket) => bucket.atMs)).toEqual([MINUTE_MS, 2 * MINUTE_MS]);
  });

  it('leaves out a bucket without a value inside the breach', () => {
    const series = breachedSeries(createPoints([9, null, 9]));
    const breach = {
      threshold: createThreshold({ value: 4 }),
      from: 0,
      to: 2 * MINUTE_MS,
      peak: 9,
    };

    const buckets = bucketsOfBreach(series, breach, TEN_MINUTES);

    expect(buckets.map((bucket) => bucket.atMs)).toEqual([0, 2 * MINUTE_MS]);
  });
});

describe(bucketAt.name, () => {
  it('finds the bucket nearest to the instant', () => {
    const series = breachedSeries(createPoints([1, 5, 3]));

    expect(bucketAt(series, 1.2 * MINUTE_MS)?.average).toBe(5);
  });

  it('finds nothing more than a step and a half from any bucket', () => {
    const series = breachedSeries(createPoints([1, 5, 3]));

    expect(bucketAt(series, 4 * MINUTE_MS)).toBeUndefined();
  });
});

describe(laneYPosition.name, () => {
  it('is the height of a value inside the lane of its series', () => {
    expect(laneYPosition(plotModel(), 's1', 50)).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX / 2);
  });

  it('is undefined for a value above the lane', () => {
    expect(laneYPosition(plotModel(), 's1', 150)).toBeUndefined();
  });

  it('is undefined for a value below the lane', () => {
    expect(laneYPosition(plotModel(), 's1', -10)).toBeUndefined();
  });

  it('is undefined for a series the plot does not draw', () => {
    expect(laneYPosition(plotModel(), 'missing', 50)).toBeUndefined();
  });
});

function breachedSeries(
  points: TimeSeriesPoint[],
  overrides: Partial<ChartSeriesView> = {},
): PlotSeries {
  return buildPlotSeries(createSeriesView({ points, ...overrides }), TEN_MINUTES, EVERYTHING_ON);
}

/** More readings than the chart draws buckets, a second apart. */
function densePoints(): TimeSeriesPoint[] {
  return Array.from({ length: CHART_MAX_BUCKETS + 200 }, (_unused, index) =>
    createPoint(index * SECOND_MS, index),
  );
}

function denseWindow() {
  return { start: 0, end: (CHART_MAX_BUCKETS + 200) * SECOND_MS };
}

/** A plot with one series on a scale from 0 to 100. */
function plotModel() {
  const series = breachedSeries(createPoints([0, 100]));
  return buildPlotModel({
    series: [
      {
        id: series.id,
        unit: series.unit,
        buckets: series.buckets,
        limits: {},
        shouldShowLimits: false,
      },
    ],
    mode: ChartMode.OVERLAID,
    width: 800,
    plotHeight: PLOT_HEIGHT_PX,
    laneHeight: 100,
    shouldShowBand: false,
  });
}
