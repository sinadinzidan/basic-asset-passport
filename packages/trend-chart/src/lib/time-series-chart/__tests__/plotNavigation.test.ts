import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import type { ChartTimeRange } from '../../../types/timeSeriesChart';
import {
  clampWindow,
  dragWindow,
  isSameWindow,
  MINIMUM_WINDOW_MS,
  panWindow,
  plotWidth,
  timeToX,
  windowSpan,
  xToTime,
  zoomWindow,
} from '../plotNavigation';
import type { PlotGeometry } from '../plotNavigation';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const SECOND_MS = 1000;
const HOUR_BOUNDS = minutes(0, 60);
const GEOMETRY: PlotGeometry = {
  left: 50,
  right: 250,
  top: 0,
  bottom: 100,
  window: { start: 0, end: 100 * SECOND_MS },
};

describe(windowSpan.name, () => {
  it('is the time from the start to the end of the window', () => {
    expect(windowSpan(minutes(10, 25))).toBe(15 * MINUTE_MS);
  });
});

describe(isSameWindow.name, () => {
  it('is true for two windows with the same start and end', () => {
    expect(isSameWindow(minutes(10, 20), minutes(10, 20))).toBe(true);
  });

  it('is false when the start or the end differs', () => {
    expect(isSameWindow(minutes(10, 20), minutes(11, 20))).toBe(false);
    expect(isSameWindow(minutes(10, 20), minutes(10, 21))).toBe(false);
  });
});

describe(clampWindow.name, () => {
  it('leaves a window inside the bounds as it is', () => {
    expect(clampWindow(minutes(10, 20), HOUR_BOUNDS)).toEqual(minutes(10, 20));
  });

  it('moves a window that starts before the bounds to their start, keeping its span', () => {
    expect(clampWindow(minutes(-5, 5), HOUR_BOUNDS)).toEqual(minutes(0, 10));
  });

  it('moves a window that ends after the bounds to their end, keeping its span', () => {
    expect(clampWindow(minutes(55, 65), HOUR_BOUNDS)).toEqual(minutes(50, 60));
  });

  it('widens a window narrower than the minimum to the minimum', () => {
    const narrow = { start: 10 * MINUTE_MS, end: 10 * MINUTE_MS + 10 * SECOND_MS };

    expect(clampWindow(narrow, HOUR_BOUNDS)).toEqual(minutes(10, 11));
  });

  it('cuts a window wider than the bounds down to the bounds', () => {
    expect(clampWindow(minutes(-100, 100), HOUR_BOUNDS)).toEqual(HOUR_BOUNDS);
  });

  it('gives the bounds themselves when they are no wider than the minimum window', () => {
    const tightBounds = { start: 0, end: 30 * SECOND_MS };

    expect(clampWindow(minutes(10, 20), tightBounds)).toEqual(tightBounds);
  });
});

describe(zoomWindow.name, () => {
  it('zooms in around the anchor, which keeps its place in the window', () => {
    expect(zoomWindow(minutes(20, 40), HOUR_BOUNDS, 0.5, 30 * MINUTE_MS)).toEqual(minutes(25, 35));
  });

  it('keeps an anchor at the start of the window at the start', () => {
    expect(zoomWindow(minutes(20, 40), HOUR_BOUNDS, 0.5, 20 * MINUTE_MS)).toEqual(minutes(20, 30));
  });

  it('zooms out around the anchor', () => {
    expect(zoomWindow(minutes(20, 40), HOUR_BOUNDS, 2, 30 * MINUTE_MS)).toEqual(minutes(10, 50));
  });

  it('does not zoom out beyond the bounds', () => {
    expect(zoomWindow(minutes(20, 40), HOUR_BOUNDS, 10, 30 * MINUTE_MS)).toEqual(HOUR_BOUNDS);
  });

  it('does not zoom in below the minimum window', () => {
    const zoomed = zoomWindow(minutes(20, 40), HOUR_BOUNDS, 0.001, 30 * MINUTE_MS);

    expect(windowSpan(zoomed)).toBe(MINIMUM_WINDOW_MS);
    expect(zoomed).toEqual(minutes(29.5, 30.5));
  });

  it('turns a window without a span into the minimum window', () => {
    expect(zoomWindow(minutes(10, 10), HOUR_BOUNDS, 0.5, 10 * MINUTE_MS)).toEqual(minutes(10, 11));
  });
});

describe(panWindow.name, () => {
  it('moves the window by the given time', () => {
    expect(panWindow(minutes(20, 40), HOUR_BOUNDS, 10 * MINUTE_MS)).toEqual(minutes(30, 50));
  });

  it('stops at the end of the bounds', () => {
    expect(panWindow(minutes(20, 40), HOUR_BOUNDS, 100 * MINUTE_MS)).toEqual(minutes(40, 60));
  });

  it('stops at the start of the bounds', () => {
    expect(panWindow(minutes(20, 40), HOUR_BOUNDS, -100 * MINUTE_MS)).toEqual(minutes(0, 20));
  });
});

describe(dragWindow.name, () => {
  it('makes a window of the dragged span', () => {
    expect(dragWindow(HOUR_BOUNDS, 10 * MINUTE_MS, 20 * MINUTE_MS)).toEqual(minutes(10, 20));
  });

  it('takes a drag from right to left the same way', () => {
    expect(dragWindow(HOUR_BOUNDS, 20 * MINUTE_MS, 10 * MINUTE_MS)).toEqual(minutes(10, 20));
  });

  it('cuts a drag that leaves the bounds at the bounds', () => {
    expect(dragWindow(HOUR_BOUNDS, -5 * MINUTE_MS, 10 * MINUTE_MS)).toEqual(minutes(0, 10));
    expect(dragWindow(HOUR_BOUNDS, 50 * MINUTE_MS, 90 * MINUTE_MS)).toEqual(minutes(50, 60));
  });

  it('is no window when the drag is narrower than the minimum, so a stray click never zooms', () => {
    expect(
      dragWindow(HOUR_BOUNDS, 10 * MINUTE_MS, 10 * MINUTE_MS + 30 * SECOND_MS),
    ).toBeUndefined();
  });

  it('accepts a drag of exactly the minimum window', () => {
    expect(dragWindow(HOUR_BOUNDS, 10 * MINUTE_MS, 11 * MINUTE_MS)).toEqual(minutes(10, 11));
  });
});

describe(plotWidth.name, () => {
  it('is the distance from the left to the right edge of the plot', () => {
    expect(plotWidth(GEOMETRY)).toBe(200);
  });

  it('is never less than one pixel, so nothing divides by zero', () => {
    expect(plotWidth({ ...GEOMETRY, left: 300, right: 250 })).toBe(1);
  });
});

describe(timeToX.name, () => {
  it('puts the start of the window at the left edge and the end at the right edge', () => {
    expect(timeToX(GEOMETRY, 0)).toBe(50);
    expect(timeToX(GEOMETRY, 100 * SECOND_MS)).toBe(250);
  });

  it('puts an instant in proportion between the edges', () => {
    expect(timeToX(GEOMETRY, 25 * SECOND_MS)).toBe(100);
  });
});

describe(xToTime.name, () => {
  it('reads the instant at a distance from the left edge of the plot', () => {
    expect(xToTime(GEOMETRY, 100)).toBe(50 * SECOND_MS);
  });

  it('stops at the start of the window left of the plot', () => {
    expect(xToTime(GEOMETRY, -10)).toBe(0);
  });

  it('stops at the end of the window right of the plot', () => {
    expect(xToTime(GEOMETRY, 500)).toBe(100 * SECOND_MS);
  });
});

function minutes(start: number, end: number): ChartTimeRange {
  return { start: start * MINUTE_MS, end: end * MINUTE_MS };
}
