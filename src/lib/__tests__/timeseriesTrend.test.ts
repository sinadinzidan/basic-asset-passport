import { describe, expect, it } from 'vitest';

import { buildSparkline, formatTrendValue, summarizeTrend } from '../timeseriesTrend';

const size = { width: 100, height: 50, padding: 5 };

function points(values: number[]) {
  return values.map((value, index) => ({ timestamp: index * 1000, value }));
}

describe(summarizeTrend.name, () => {
  it('has no summary without points', () => {
    expect(summarizeTrend([])).toBeNull();
  });

  it('reports the newest, lowest, highest and average reading', () => {
    expect(summarizeTrend(points([4, 10, 1, 7]))).toEqual({
      latest: 7,
      minimum: 1,
      maximum: 10,
      average: 5.5,
    });
  });
});

describe(buildSparkline.name, () => {
  it('has no drawing without points', () => {
    expect(buildSparkline([], size)).toBeNull();
  });

  it('runs from the left to the right edge of the padded box', () => {
    const drawing = buildSparkline(points([0, 10]), size);

    expect(drawing?.linePath).toBe('M5 45 L95 5');
    expect(drawing?.lastPoint).toEqual({ x: 95, y: 5 });
  });

  it('closes the area down to the bottom of the box', () => {
    const drawing = buildSparkline(points([0, 10]), size);

    expect(drawing?.areaPath).toBe('M5 45 L95 5 L95 45 L5 45 Z');
  });

  it('places the lowest value at the bottom and the highest at the top', () => {
    const drawing = buildSparkline(points([3, 9, 6]), size);

    expect(drawing?.linePath).toBe('M5 45 L50 5 L95 25');
  });

  it('draws a flat series through the middle', () => {
    const drawing = buildSparkline(points([4, 4, 4]), size);

    expect(drawing?.linePath).toBe('M5 25 L50 25 L95 25');
  });

  it('draws a single reading in the middle', () => {
    const drawing = buildSparkline(points([4]), size);

    expect(drawing?.lastPoint).toEqual({ x: 50, y: 25 });
  });

  it('spaces the points by their time, not their number', () => {
    const drawing = buildSparkline(
      [
        { timestamp: 0, value: 0 },
        { timestamp: 900, value: 5 },
        { timestamp: 1000, value: 10 },
      ],
      size,
    );

    expect(drawing?.linePath).toBe('M5 45 L86 25 L95 5');
  });

  it('gives three guide lines from top to bottom', () => {
    expect(buildSparkline(points([1, 2]), size)?.gridLines).toEqual([5, 25, 45]);
  });
});

describe(formatTrendValue.name, () => {
  it.each([
    [1234.5678, '1,234.57'],
    [3, '3'],
    [0.1, '0.1'],
    [-2.5, '-2.5'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatTrendValue(value)).toBe(expected);
  });
});
