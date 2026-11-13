import { describe, expect, it } from 'vitest';

import {
  CHART_COLOR_PALETTE,
  CHART_MAX_SERIES,
  CHART_TITLE_MAX_LENGTH,
} from '../../../constants/timeSeriesChart';
import { ChartMode, ChartRange } from '../../../enums/monitoring';
import {
  AxisScaleMode,
  ChartOverlay,
  ChartPanel,
  LineStyle,
  ThresholdLevel,
  ThresholdSide,
} from '../../../enums/timeSeriesChart';
import type { ChartConfiguration } from '../../../types/timeSeriesChart';
import {
  addSeries,
  createChartConfiguration,
  defaultSeriesStyle,
  moveSeries,
  parseConfiguration,
  removeSeries,
  serialiseConfiguration,
  setDisplayUnit,
  setSeriesStyle,
  setSeriesVisible,
  setTitle,
  setWindow,
  showAllSeries,
  showOnlySeries,
  toggleOverlay,
  togglePanel,
} from '../configuration';

const DEFAULT_OVERLAYS = [
  ChartOverlay.THRESHOLDS,
  ChartOverlay.EVENT_MARKERS,
  ChartOverlay.DATA_GAPS,
];
const SOLID_FIRST_COLOUR = {
  color: 'var(--chart-nordic-color-1)',
  lineWidth: 1.5,
  lineStyle: LineStyle.SOLID,
};

describe(defaultSeriesStyle.name, () => {
  it('gives the first series the first colour as a thin solid line', () => {
    expect(defaultSeriesStyle(0)).toEqual(SOLID_FIRST_COLOUR);
  });

  it('gives each following series the next colour', () => {
    expect(defaultSeriesStyle(1).color).toBe('var(--chart-fjord-color-1)');
    expect(defaultSeriesStyle(2).color).toBe('var(--chart-orange-color-1)');
  });

  it('starts the colours again, dashed, once every colour is taken', () => {
    expect(defaultSeriesStyle(CHART_COLOR_PALETTE.length)).toEqual({
      color: 'var(--chart-nordic-color-1)',
      lineWidth: 1.5,
      lineStyle: LineStyle.DASHED,
    });
  });
});

describe(createChartConfiguration.name, () => {
  it('starts an untitled, overlaid chart of the last week', () => {
    const configuration = createChartConfiguration([]);

    expect(configuration).toEqual({
      title: 'Untitled chart',
      range: ChartRange.ONE_WEEK,
      mode: ChartMode.OVERLAID,
      series: [],
      axes: [],
      thresholds: [],
      shouldShowGridlines: true,
      shouldShowMinMax: false,
      isMarkerMode: false,
      isLive: false,
      overlays: DEFAULT_OVERLAYS,
    });
  });

  it('shows every series it is given, each in its default style', () => {
    const configuration = createChartConfiguration(['a', 'b']);

    expect(configuration.series).toEqual([
      { seriesId: 'a', isVisible: true, style: defaultSeriesStyle(0) },
      { seriesId: 'b', isVisible: true, style: defaultSeriesStyle(1) },
    ]);
  });

  it('takes no more series than the chart can draw', () => {
    const configuration = createChartConfiguration(seriesIds(CHART_MAX_SERIES + 3));

    expect(configuration.series).toHaveLength(CHART_MAX_SERIES);
  });

  it('lets the caller override any default', () => {
    const configuration = createChartConfiguration(['a'], {
      title: 'Pump 4',
      mode: ChartMode.STACKED,
    });

    expect(configuration).toMatchObject({
      title: 'Pump 4',
      mode: ChartMode.STACKED,
      range: ChartRange.ONE_WEEK,
    });
  });

  it('gives each chart its own list of overlays', () => {
    const first = createChartConfiguration([]);
    const second = createChartConfiguration([]);

    expect(first.overlays).not.toBe(second.overlays);
  });
});

describe(addSeries.name, () => {
  it('adds the series last, visible, in the default style of its place', () => {
    const { configuration, error } = addSeries(createChartConfiguration(['a']), 'b');

    expect(error).toBeUndefined();
    expect(configuration.series[1]).toEqual({
      seriesId: 'b',
      isVisible: true,
      style: defaultSeriesStyle(1),
    });
  });

  it('refuses a series that is already on the chart', () => {
    const before = createChartConfiguration(['a']);

    const { configuration, error } = addSeries(before, 'a');

    expect(error).toBe('This series is already on the chart.');
    expect(configuration).toBe(before);
  });

  it('refuses a series once the chart is full', () => {
    const before = createChartConfiguration(seriesIds(CHART_MAX_SERIES));

    const { configuration, error } = addSeries(before, 'one-more');

    expect(error).toBe('You can chart up to 12 series.');
    expect(configuration).toBe(before);
  });
});

describe(removeSeries.name, () => {
  it('takes the series off the chart', () => {
    const configuration = removeSeries(createChartConfiguration(['a', 'b', 'c']), 'b');

    expect(idsOf(configuration)).toEqual(['a', 'c']);
  });

  it('leaves the chart as it is for a series it does not have', () => {
    const configuration = removeSeries(createChartConfiguration(['a']), 'missing');

    expect(idsOf(configuration)).toEqual(['a']);
  });
});

describe(setSeriesVisible.name, () => {
  it('hides the one series', () => {
    const configuration = setSeriesVisible(createChartConfiguration(['a', 'b']), 'a', false);

    expect(visibleIdsOf(configuration)).toEqual(['b']);
  });

  it('shows a hidden series again', () => {
    const hidden = setSeriesVisible(createChartConfiguration(['a', 'b']), 'a', false);

    const configuration = setSeriesVisible(hidden, 'a', true);

    expect(visibleIdsOf(configuration)).toEqual(['a', 'b']);
  });
});

describe(showAllSeries.name, () => {
  it('shows every hidden series', () => {
    const hidden = showOnlySeries(createChartConfiguration(['a', 'b', 'c']), 'b');

    expect(visibleIdsOf(showAllSeries(hidden))).toEqual(['a', 'b', 'c']);
  });
});

describe(showOnlySeries.name, () => {
  it('hides every series but the one', () => {
    const configuration = showOnlySeries(createChartConfiguration(['a', 'b', 'c']), 'b');

    expect(visibleIdsOf(configuration)).toEqual(['b']);
  });

  it('shows the one series when it was hidden', () => {
    const hidden = setSeriesVisible(createChartConfiguration(['a', 'b']), 'b', false);

    expect(visibleIdsOf(showOnlySeries(hidden, 'b'))).toEqual(['b']);
  });
});

describe(setSeriesStyle.name, () => {
  it('changes only the part of the style it is given', () => {
    const configuration = setSeriesStyle(createChartConfiguration(['a']), 'a', {
      lineStyle: LineStyle.DOTTED,
    });

    expect(configuration.series[0]?.style).toEqual({
      ...SOLID_FIRST_COLOUR,
      lineStyle: LineStyle.DOTTED,
    });
  });

  it('leaves the other series as they are', () => {
    const before = createChartConfiguration(['a', 'b']);

    const configuration = setSeriesStyle(before, 'a', { lineWidth: 3.5 });

    expect(configuration.series[1]).toBe(before.series[1]);
  });
});

describe(setDisplayUnit.name, () => {
  it('shows the series in a unit it can be converted to', () => {
    const { configuration, error } = setDisplayUnit(
      createChartConfiguration(['a']),
      'a',
      'bar',
      'kPa',
    );

    expect(error).toBeUndefined();
    expect(configuration.series[0]?.displayUnit).toBe('kPa');
  });

  it('refuses a unit with no known conversion', () => {
    const before = createChartConfiguration(['a']);

    const { configuration, error } = setDisplayUnit(before, 'a', 'bar', '°C');

    expect(error).toBe('There is no known conversion from bar to °C.');
    expect(configuration).toBe(before);
  });

  it('refuses any unit for a series whose own unit is unknown', () => {
    const { error } = setDisplayUnit(createChartConfiguration(['a']), 'a', undefined, 'bar');

    expect(error).toBe('There is no known conversion from this unit to bar.');
  });

  it('goes back to the own unit of the series when that is chosen', () => {
    const converted = setDisplayUnit(
      createChartConfiguration(['a']),
      'a',
      'bar',
      'kPa',
    ).configuration;

    const { configuration, error } = setDisplayUnit(converted, 'a', 'bar', 'bar');

    expect(error).toBeUndefined();
    expect(configuration.series[0]?.displayUnit).toBeUndefined();
  });

  it('goes back to the own unit of the series when no unit is chosen', () => {
    const converted = setDisplayUnit(
      createChartConfiguration(['a']),
      'a',
      'bar',
      'kPa',
    ).configuration;

    const { configuration } = setDisplayUnit(converted, 'a', 'bar', undefined);

    expect(configuration.series[0]?.displayUnit).toBeUndefined();
  });
});

describe(moveSeries.name, () => {
  it('moves the series down the list', () => {
    const configuration = moveSeries(createChartConfiguration(['a', 'b', 'c']), 'a', 1);

    expect(idsOf(configuration)).toEqual(['b', 'a', 'c']);
  });

  it('moves the series up the list', () => {
    const configuration = moveSeries(createChartConfiguration(['a', 'b', 'c']), 'c', -2);

    expect(idsOf(configuration)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the first series where it is when moved up', () => {
    const before = createChartConfiguration(['a', 'b']);

    expect(moveSeries(before, 'a', -1)).toBe(before);
  });

  it('leaves the last series where it is when moved down', () => {
    const before = createChartConfiguration(['a', 'b']);

    expect(moveSeries(before, 'b', 1)).toBe(before);
  });

  it('leaves the chart as it is for a series it does not have', () => {
    const before = createChartConfiguration(['a', 'b']);

    expect(moveSeries(before, 'missing', 1)).toBe(before);
  });
});

describe(toggleOverlay.name, () => {
  it('turns on an overlay that was off', () => {
    const configuration = toggleOverlay(createChartConfiguration([]), ChartOverlay.MIN_MAX_BAND);

    expect(configuration.overlays).toEqual([...DEFAULT_OVERLAYS, ChartOverlay.MIN_MAX_BAND]);
  });

  it('turns off an overlay that was on', () => {
    const configuration = toggleOverlay(createChartConfiguration([]), ChartOverlay.EVENT_MARKERS);

    expect(configuration.overlays).toEqual([ChartOverlay.THRESHOLDS, ChartOverlay.DATA_GAPS]);
  });
});

describe(togglePanel.name, () => {
  it('opens the panel', () => {
    expect(togglePanel(createChartConfiguration([]), ChartPanel.LAYERS).panel).toBe(
      ChartPanel.LAYERS,
    );
  });

  it('closes the panel that is open', () => {
    const opened = togglePanel(createChartConfiguration([]), ChartPanel.LAYERS);

    expect(togglePanel(opened, ChartPanel.LAYERS).panel).toBeUndefined();
  });

  it('opens another panel in place of the open one', () => {
    const opened = togglePanel(createChartConfiguration([]), ChartPanel.LAYERS);

    expect(togglePanel(opened, ChartPanel.AXES).panel).toBe(ChartPanel.AXES);
  });
});

describe(setTitle.name, () => {
  it('takes the title without the space around it', () => {
    expect(setTitle(createChartConfiguration([]), '  Pump 4  ').title).toBe('Pump 4');
  });

  it('cuts a title that is too long', () => {
    const configuration = setTitle(
      createChartConfiguration([]),
      'x'.repeat(CHART_TITLE_MAX_LENGTH + 5),
    );

    expect(configuration.title).toBe('x'.repeat(CHART_TITLE_MAX_LENGTH));
  });

  it('goes back to the default title for an empty one', () => {
    const titled = setTitle(createChartConfiguration([]), 'Pump 4');

    expect(setTitle(titled, '   ').title).toBe('Untitled chart');
  });
});

describe(setWindow.name, () => {
  it('keeps the window of a custom range', () => {
    const configuration = setWindow(createChartConfiguration([]), ChartRange.CUSTOM, {
      start: 100,
      end: 200,
    });

    expect(configuration).toMatchObject({
      range: ChartRange.CUSTOM,
      window: { start: 100, end: 200 },
    });
  });

  it('drops the window for a relative range, which follows now', () => {
    const custom = setWindow(createChartConfiguration([]), ChartRange.CUSTOM, {
      start: 100,
      end: 200,
    });

    const configuration = setWindow(custom, ChartRange.ONE_HOUR, { start: 100, end: 200 });

    expect(configuration.range).toBe(ChartRange.ONE_HOUR);
    expect(configuration.window).toBeUndefined();
  });
});

describe('thresholds the user added', () => {
  const added = {
    seriesId: 'a',
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.UPPER,
    value: 8.5,
    unit: 'bar',
  };

  it('writes each one as its series, level, side, value and unit', () => {
    const options = serialiseConfiguration(
      createChartConfiguration(['a'], { thresholds: [added] }),
    );

    expect(options.th).toBe('a|A|U|8.5|bar');
  });

  it('writes nothing for a chart without any', () => {
    expect(serialiseConfiguration(createChartConfiguration(['a'])).th).toBeUndefined();
  });

  it('restores them from the link', () => {
    const restored = parseConfiguration(
      { sig: 'a', th: 'a|A|U|8.5|bar;a|D|L|-1|m%C2%B3%2Fh' },
      createChartConfiguration([]),
    );

    expect(restored.thresholds).toEqual([
      added,
      {
        seriesId: 'a',
        level: ThresholdLevel.DANGER,
        side: ThresholdSide.LOWER,
        value: -1,
        unit: 'm³/h',
      },
    ]);
  });

  it('drops one that is malformed or belongs to a series that is not on the chart', () => {
    const restored = parseConfiguration(
      { sig: 'a', th: 'b|A|U|8|bar;a|X|U|8|bar;a|A|Q|8|bar;a|A|U|high|bar;;a|A|U|3|%E0%A4%A' },
      createChartConfiguration([]),
    );

    expect(restored.thresholds).toEqual([{ ...added, value: 3, unit: '' }]);
  });

  it('go with their series when it is taken off the chart', () => {
    const before = createChartConfiguration(['a', 'b'], {
      thresholds: [added, { ...added, seriesId: 'b' }],
    });

    expect(removeSeries(before, 'a').thresholds).toEqual([{ ...added, seriesId: 'b' }]);
  });
});

describe(serialiseConfiguration.name, () => {
  it('writes only the series, their styles, the mode, the range and the overlays for a default chart', () => {
    expect(serialiseConfiguration(createChartConfiguration(['a', 'b']))).toEqual({
      sig: 'a,b',
      st: '0.0.S,1.0.S',
      mode: ChartMode.OVERLAID,
      range: ChartRange.ONE_WEEK,
      ov: 'THRESHOLDS,EVENT_MARKERS,DATA_GAPS',
    });
  });

  it('writes a style as the place of its colour and width and a letter for its line', () => {
    const styled = setSeriesStyle(createChartConfiguration(['a']), 'a', {
      color: 'var(--chart-orange-color-1)',
      lineWidth: 2.25,
      lineStyle: LineStyle.DOTTED,
    });

    expect(serialiseConfiguration(styled).st).toBe('2.1.T');
  });

  it('writes the first colour and width for a style the chart does not offer', () => {
    const styled = setSeriesStyle(createChartConfiguration(['a']), 'a', {
      color: 'var(--other)',
      lineWidth: 9,
    });

    expect(serialiseConfiguration(styled).st).toBe('0.0.S');
  });

  it('writes a title that is not the default', () => {
    expect(serialiseConfiguration(createChartConfiguration([], { title: 'Pump 4' })).title).toBe(
      'Pump 4',
    );
  });

  it('writes the window of a custom range', () => {
    const custom = setWindow(createChartConfiguration([]), ChartRange.CUSTOM, {
      start: 100,
      end: 200,
    });

    expect(serialiseConfiguration(custom)).toMatchObject({
      range: ChartRange.CUSTOM,
      from: '100',
      to: '200',
    });
  });

  it('writes which series are hidden', () => {
    const hidden = showOnlySeries(createChartConfiguration(['a', 'b', 'c']), 'b');

    expect(serialiseConfiguration(hidden).hid).toBe('a,c');
  });

  it('writes the display unit of each series that has one', () => {
    const first = setDisplayUnit(
      createChartConfiguration(['a', 'b', 'c']),
      'a',
      'bar',
      'kPa',
    ).configuration;
    const both = setDisplayUnit(first, 'c', '°C', '°F').configuration;

    expect(serialiseConfiguration(both).du).toBe('a=kPa;c=°F');
  });

  it('writes the limits of the manual axes and leaves out the automatic ones', () => {
    const configuration = createChartConfiguration(['a', 'b', 'c'], {
      axes: [
        { seriesId: 'a', mode: AxisScaleMode.MANUAL, min: 0, max: 10 },
        { seriesId: 'b', mode: AxisScaleMode.AUTO, min: 1, max: 2 },
        { seriesId: 'c', mode: AxisScaleMode.MANUAL, max: 50 },
      ],
    });

    expect(serialiseConfiguration(configuration).ax).toBe('a|0|10;c||50');
  });

  it('writes the switches that differ from their defaults', () => {
    const configuration = createChartConfiguration([], {
      shouldShowGridlines: false,
      shouldShowMinMax: true,
      isMarkerMode: true,
      markerAt: 1500,
      isLive: true,
      panel: ChartPanel.AXES,
    });

    expect(serialiseConfiguration(configuration)).toMatchObject({
      grid: '0',
      mm: '1',
      mk: '1',
      at: '1500',
      live: '1',
      pn: ChartPanel.AXES,
    });
  });
});

describe(parseConfiguration.name, () => {
  it('restores the panel that was serialised', () => {
    const fallback = createChartConfiguration([]);
    const opened = togglePanel(fallback, ChartPanel.ASSISTANT);

    const restored = parseConfiguration(serialiseConfiguration(opened), fallback);

    expect(restored.panel).toBe(ChartPanel.ASSISTANT);
  });

  it('ignores a panel name it does not know', () => {
    const restored = parseConfiguration({ pn: 'NOT_A_PANEL' }, createChartConfiguration([]));

    expect(restored.panel).toBeUndefined();
  });

  it('is the fallback when there are no options', () => {
    const fallback = createChartConfiguration(['a']);

    expect(parseConfiguration(undefined, fallback)).toBe(fallback);
    expect(parseConfiguration({}, fallback)).toBe(fallback);
  });

  it('restores everything that was serialised', () => {
    const configuration = fullConfiguration();

    const restored = parseConfiguration(
      serialiseConfiguration(configuration),
      createChartConfiguration([]),
    );

    expect(restored).toEqual(configuration);
  });

  it('keeps the series of the fallback, in their default styles, when the options name none', () => {
    const restored = parseConfiguration(
      { mode: ChartMode.STACKED },
      createChartConfiguration(['a', 'b']),
    );

    expect(restored.series).toEqual([
      { seriesId: 'a', isVisible: true, style: defaultSeriesStyle(0), displayUnit: undefined },
      { seriesId: 'b', isVisible: true, style: defaultSeriesStyle(1), displayUnit: undefined },
    ]);
  });

  it('has no series when the options name an empty list', () => {
    const restored = parseConfiguration({ sig: '' }, createChartConfiguration(['a', 'b']));

    expect(restored.series).toEqual([]);
  });

  it('takes no more series than the chart can draw', () => {
    const restored = parseConfiguration(
      { sig: seriesIds(CHART_MAX_SERIES + 3).join(',') },
      createChartConfiguration([]),
    );

    expect(restored.series).toHaveLength(CHART_MAX_SERIES);
  });

  it('gives a series the default style of its place when its style cannot be read', () => {
    const restored = parseConfiguration(
      { sig: 'a,b', st: 'nonsense' },
      createChartConfiguration([]),
    );

    expect(restored.series.map((entry) => entry.style)).toEqual([
      defaultSeriesStyle(0),
      defaultSeriesStyle(1),
    ]);
  });

  it('keeps the range of the fallback for a range it does not know', () => {
    const fallback = createChartConfiguration([], { range: ChartRange.ONE_DAY });

    expect(parseConfiguration({ range: 'NEXT_WEEK' }, fallback).range).toBe(ChartRange.ONE_DAY);
  });

  it('keeps the range of the fallback for a custom range without a window', () => {
    const restored = parseConfiguration({ range: ChartRange.CUSTOM }, createChartConfiguration([]));

    expect(restored.range).toBe(ChartRange.ONE_WEEK);
    expect(restored.window).toBeUndefined();
  });

  it('keeps the range of the fallback for a custom window that ends before it starts', () => {
    const restored = parseConfiguration(
      { range: ChartRange.CUSTOM, from: '200', to: '100' },
      createChartConfiguration([]),
    );

    expect(restored.range).toBe(ChartRange.ONE_WEEK);
    expect(restored.window).toBeUndefined();
  });

  it('ignores a window given with a relative range', () => {
    const restored = parseConfiguration(
      { range: ChartRange.ONE_HOUR, from: '100', to: '200' },
      createChartConfiguration([]),
    );

    expect(restored.range).toBe(ChartRange.ONE_HOUR);
    expect(restored.window).toBeUndefined();
  });

  it('keeps the mode of the fallback for a mode it does not know', () => {
    const fallback = createChartConfiguration([], { mode: ChartMode.NORMALISED });

    expect(parseConfiguration({ mode: 'SIDEWAYS' }, fallback).mode).toBe(ChartMode.NORMALISED);
  });

  it('leaves out an overlay it does not know', () => {
    const restored = parseConfiguration({ ov: 'DATA_GAPS,SPARKLES' }, createChartConfiguration([]));

    expect(restored.overlays).toEqual([ChartOverlay.DATA_GAPS]);
  });

  it('keeps the overlays of the fallback when the options name none', () => {
    const fallback = createChartConfiguration([], { overlays: [ChartOverlay.MIN_MAX_BAND] });

    expect(parseConfiguration({ sig: 'a' }, fallback).overlays).toEqual([
      ChartOverlay.MIN_MAX_BAND,
    ]);
  });

  it('turns every overlay off for an empty list', () => {
    expect(parseConfiguration({ ov: '' }, createChartConfiguration([])).overlays).toEqual([]);
  });

  it('cuts a title that is too long', () => {
    const restored = parseConfiguration(
      { title: 'x'.repeat(CHART_TITLE_MAX_LENGTH + 5) },
      createChartConfiguration([]),
    );

    expect(restored.title).toBe('x'.repeat(CHART_TITLE_MAX_LENGTH));
  });

  it('keeps the title of the fallback when the options have none', () => {
    const fallback = createChartConfiguration([], { title: 'Pump 4' });

    expect(parseConfiguration({ sig: 'a' }, fallback).title).toBe('Pump 4');
  });

  it('has no marker for a marker time that is not a number', () => {
    const restored = parseConfiguration({ mk: '1', at: 'noon' }, createChartConfiguration([]));

    expect(restored.isMarkerMode).toBe(true);
    expect(restored.markerAt).toBeUndefined();
  });

  it('ignores a display unit that names no series', () => {
    const restored = parseConfiguration(
      { sig: 'a,b', du: 'kPa;b=°F' },
      createChartConfiguration([]),
    );

    expect(restored.series.map((entry) => entry.displayUnit)).toEqual([undefined, '°F']);
  });

  it('drops an axis without a series or without any limit', () => {
    const restored = parseConfiguration(
      { sig: 'a,b', ax: '|0|10;a||;b|5|' },
      createChartConfiguration([]),
    );

    expect(restored.axes).toEqual([
      { seriesId: 'b', mode: AxisScaleMode.MANUAL, min: 5, max: undefined },
    ]);
  });

  it('shows the gridlines and turns the other switches off unless the options say otherwise', () => {
    const fallback = createChartConfiguration([], {
      shouldShowGridlines: false,
      shouldShowMinMax: true,
      isLive: true,
    });

    const restored = parseConfiguration({ sig: 'a' }, fallback);

    expect(restored).toMatchObject({
      shouldShowGridlines: true,
      shouldShowMinMax: false,
      isMarkerMode: false,
      isLive: false,
    });
  });
});

function seriesIds(count: number): string[] {
  return Array.from({ length: count }, (_unused, index) => `series-${index}`);
}

function idsOf(configuration: ChartConfiguration): string[] {
  return configuration.series.map((entry) => entry.seriesId);
}

function visibleIdsOf(configuration: ChartConfiguration): string[] {
  return configuration.series.filter((entry) => entry.isVisible).map((entry) => entry.seriesId);
}

/** A chart with every option away from its default. */
function fullConfiguration(): ChartConfiguration {
  return {
    title: 'Pump 4 pressures',
    range: ChartRange.CUSTOM,
    window: { start: 1000, end: 5000 },
    mode: ChartMode.STACKED,
    series: [
      {
        seriesId: 'a',
        isVisible: true,
        style: {
          color: 'var(--chart-orange-color-1)',
          lineWidth: 2.25,
          lineStyle: LineStyle.DOTTED,
        },
        displayUnit: 'kPa',
      },
      {
        seriesId: 'b',
        isVisible: false,
        style: { color: 'var(--chart-fjord-color-1)', lineWidth: 3.5, lineStyle: LineStyle.DASHED },
      },
    ],
    axes: [{ seriesId: 'a', mode: AxisScaleMode.MANUAL, min: 0, max: 10 }],
    thresholds: [
      {
        seriesId: 'a',
        level: ThresholdLevel.DANGER,
        side: ThresholdSide.LOWER,
        value: -2.5,
        unit: 'm³/h',
      },
    ],
    shouldShowGridlines: false,
    shouldShowMinMax: true,
    isMarkerMode: true,
    markerAt: 3000,
    isLive: true,
    overlays: [ChartOverlay.MIN_MAX_BAND],
    panel: ChartPanel.AXES,
  };
}
