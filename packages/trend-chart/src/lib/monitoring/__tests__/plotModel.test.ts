import { describe, expect, it } from 'vitest';

import { AxisSide } from '../../../enums/axisSide';
import { ChartMode } from '../../../enums/monitoring';
import { AxisScaleMode } from '../../../enums/timeSeriesChart';
import type { ChartBucket } from '../chartModel';
import {
  AXIS_WIDTH_PX,
  buildPlotModel,
  LANE_GAP_PX,
  NORMALISED_DOMAIN,
  PLOT_PADDING_PX,
  PLOT_TOP_PX,
  TIME_AXIS_HEIGHT_PX,
  yPosition,
} from '../plotModel';
import type { LimitValues, PlotModelInput, PlotSeriesInput } from '../plotModel';

const WIDE_PX = 800;
/** Too narrow for more than one value axis. */
const NARROW_PX = 200;
const PLOT_HEIGHT_PX = 270;
const LANE_HEIGHT_PX = 100;

describe(buildPlotModel.name, () => {
  it('gives a single series one axis on a round scale over its values', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [3, 97])] }));

    expect(model.axes).toEqual([
      {
        id: 'axis-0',
        unit: 'bar',
        side: AxisSide.LEFT,
        slot: 0,
        domain: { minimum: 0, maximum: 100, ticks: [0, 20, 40, 60, 80, 100] },
        laneIndex: 0,
        seriesIds: ['a'],
        isNormalised: false,
      },
    ]);
  });

  it('leaves room for the axis on the left and the padding on the right', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [3, 97])] }));

    expect(model.plotLeft).toBe(AXIS_WIDTH_PX + PLOT_PADDING_PX);
    expect(model.plotRight).toBe(WIDE_PX - PLOT_PADDING_PX);
  });

  it('is as high as the plot with the room above it and the time axis below', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [3, 97])] }));

    expect(model.lanes).toEqual([{ index: 0, top: PLOT_TOP_PX, height: PLOT_HEIGHT_PX }]);
    expect(model.height).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX + TIME_AXIS_HEIGHT_PX);
  });

  it('gives each series an axis of its own while there is room, even for the same unit', () => {
    const model = buildPlotModel(
      input({ series: [series('a', 'bar', [0, 10]), series('b', 'bar', [50, 100])] }),
    );

    expect(model.axes.map((axis) => axis.seriesIds)).toEqual([['a'], ['b']]);
    expect(model.axes.map((axis) => axis.domain.maximum)).toEqual([10, 100]);
    expect(model.plotLeft).toBe(2 * AXIS_WIDTH_PX + PLOT_PADDING_PX);
  });

  it('shares an axis between the series of one unit when the axes would take too much of the width', () => {
    const model = buildPlotModel(
      input({
        width: NARROW_PX,
        series: [series('a', 'bar', [0, 10]), series('b', 'bar', [50, 100])],
      }),
    );

    expect(model.axes).toHaveLength(1);
    expect(model.axes[0]).toMatchObject({
      unit: 'bar',
      seriesIds: ['a', 'b'],
      domain: { minimum: 0, maximum: 100 },
    });
    expect(model.didSwitchToNormalised).toBe(false);
  });

  it('switches to normalised when even one axis per unit would take too much of the width', () => {
    const model = buildPlotModel(
      input({
        width: NARROW_PX,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [50, 100])],
      }),
    );

    expect(model.didSwitchToNormalised).toBe(true);
    expect(model.mode).toBe(ChartMode.NORMALISED);
  });

  it('draws every series on one percentage axis when normalised', () => {
    const model = buildPlotModel(
      input({
        mode: ChartMode.NORMALISED,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [50, 100])],
      }),
    );

    expect(model.axes).toEqual([
      {
        id: 'axis-normalised',
        unit: '%',
        side: AxisSide.LEFT,
        slot: 0,
        domain: NORMALISED_DOMAIN,
        laneIndex: 0,
        seriesIds: ['a', 'b'],
        isNormalised: true,
      },
    ]);
    expect(model.didSwitchToNormalised).toBe(false);
  });

  it('remembers what each normalised series ranged over', () => {
    const model = buildPlotModel(
      input({
        mode: ChartMode.NORMALISED,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [50, 100])],
      }),
    );

    expect(model.scales.get('a')?.extent).toEqual({ minimum: 0, maximum: 10 });
    expect(model.scales.get('b')?.extent).toEqual({ minimum: 50, maximum: 100 });
  });

  it('gives each series a lane and an axis of its own when stacked', () => {
    const model = buildPlotModel(
      input({
        mode: ChartMode.STACKED,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [50, 100])],
      }),
    );

    expect(model.lanes).toEqual([
      { index: 0, top: PLOT_TOP_PX, height: LANE_HEIGHT_PX },
      { index: 1, top: PLOT_TOP_PX + LANE_HEIGHT_PX + LANE_GAP_PX, height: LANE_HEIGHT_PX },
    ]);
    expect(model.axes.map((axis) => [axis.id, axis.laneIndex, axis.unit])).toEqual([
      ['axis-a', 0, 'bar'],
      ['axis-b', 1, '°C'],
    ]);
  });

  it('is as high as all its lanes when stacked', () => {
    const model = buildPlotModel(
      input({
        mode: ChartMode.STACKED,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [50, 100])],
      }),
    );

    expect(model.height).toBe(PLOT_TOP_PX + 2 * LANE_HEIGHT_PX + LANE_GAP_PX + TIME_AXIS_HEIGHT_PX);
  });

  it('scales to the averages alone while the min and max band is off', () => {
    const banded = { ...series('a', 'bar', []), buckets: [bandBucket(5, 0, 10)] };

    const model = buildPlotModel(input({ series: [banded], shouldShowBand: false }));

    expect(model.axes[0]?.domain).toMatchObject({ minimum: 4, maximum: 6 });
  });

  it('makes room for the min and max band when it is shown', () => {
    const banded = { ...series('a', 'bar', []), buckets: [bandBucket(5, 0, 10)] };

    const model = buildPlotModel(input({ series: [banded], shouldShowBand: true }));

    expect(model.axes[0]?.domain).toMatchObject({ minimum: 0, maximum: 10 });
  });

  it('makes room for the limits of a series that shows them', () => {
    const model = buildPlotModel(
      input({ series: [series('a', 'bar', [10, 20], { dangerHigh: 80 }, true)] }),
    );

    expect(model.axes[0]?.domain).toMatchObject({ minimum: 0, maximum: 80 });
  });

  it('ignores the limits of a series that hides them', () => {
    const model = buildPlotModel(
      input({ series: [series('a', 'bar', [10, 20], { dangerHigh: 80 }, false)] }),
    );

    expect(model.axes[0]?.domain).toMatchObject({ minimum: 10, maximum: 20 });
  });

  it('uses the exact manual limits of an axis and keeps the ticks inside them', () => {
    const model = buildPlotModel(
      input({
        series: [series('a', 'bar', [10, 20])],
        axes: [{ seriesId: 'a', mode: AxisScaleMode.MANUAL, min: 3, max: 47 }],
      }),
    );

    expect(model.axes[0]?.domain).toEqual({ minimum: 3, maximum: 47, ticks: [10, 20, 30, 40] });
  });

  it('scales a series without a value from zero to one', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [])] }));

    expect(model.axes[0]?.domain).toMatchObject({ minimum: 0, maximum: 1 });
  });

  it('still has a plot, with room for an axis, when there is no series', () => {
    const model = buildPlotModel(input({ series: [] }));

    expect(model.axes).toEqual([]);
    expect(model.plotLeft).toBe(AXIS_WIDTH_PX + PLOT_PADDING_PX);
    expect(model.height).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX + TIME_AXIS_HEIGHT_PX);
  });
});

describe(yPosition.name, () => {
  it('puts the bottom of the scale at the bottom of the plot and the top at the top', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [0, 100])] }));

    expect(yPosition(model, 'a', 0)).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX);
    expect(yPosition(model, 'a', 100)).toBe(PLOT_TOP_PX);
  });

  it('puts a value in proportion between them', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [0, 100])] }));

    expect(yPosition(model, 'a', 50)).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX / 2);
  });

  it('places a normalised value by where it lies in what the series ranged over', () => {
    const model = buildPlotModel(
      input({ mode: ChartMode.NORMALISED, series: [series('a', 'bar', [50, 100])] }),
    );

    expect(yPosition(model, 'a', 75)).toBe(PLOT_TOP_PX + PLOT_HEIGHT_PX / 2);
  });

  it('has no place for a normalised value of a series without readings', () => {
    const model = buildPlotModel(
      input({ mode: ChartMode.NORMALISED, series: [series('a', 'bar', [])] }),
    );

    expect(yPosition(model, 'a', 75)).toBeUndefined();
  });

  it('places a stacked value inside the lane of its series', () => {
    const model = buildPlotModel(
      input({
        mode: ChartMode.STACKED,
        series: [series('a', 'bar', [0, 10]), series('b', '°C', [0, 10])],
      }),
    );
    const secondLaneTop = PLOT_TOP_PX + LANE_HEIGHT_PX + LANE_GAP_PX;

    expect(yPosition(model, 'b', 10)).toBe(secondLaneTop);
    expect(yPosition(model, 'b', 0)).toBe(secondLaneTop + LANE_HEIGHT_PX);
  });

  it('has no place for a series the plot does not draw', () => {
    const model = buildPlotModel(input({ series: [series('a', 'bar', [0, 100])] }));

    expect(yPosition(model, 'missing', 50)).toBeUndefined();
  });
});

function input(overrides: Partial<PlotModelInput> = {}): PlotModelInput {
  return {
    series: [],
    mode: ChartMode.OVERLAID,
    width: WIDE_PX,
    plotHeight: PLOT_HEIGHT_PX,
    laneHeight: LANE_HEIGHT_PX,
    shouldShowBand: false,
    ...overrides,
  };
}

function series(
  id: string,
  unit: string,
  values: readonly number[],
  limits: LimitValues = {},
  shouldShowLimits = false,
): PlotSeriesInput {
  return {
    id,
    unit,
    buckets: values.map((value, index) => bandBucket(value, value, value, index)),
    limits,
    shouldShowLimits,
  };
}

function bandBucket(average: number, minimum: number, maximum: number, atMs = 0): ChartBucket {
  return { atMs, average, minimum, maximum, goodCount: 1, flaggedCount: 0 };
}
