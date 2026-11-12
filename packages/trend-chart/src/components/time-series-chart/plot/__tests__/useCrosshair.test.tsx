import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ChartTimersContext } from '../../../../hooks/time-series-chart/useChartTimers';
import { createManualFrameTimers } from '../../../../mocks/manualFrameTimers';
import { useCrosshair } from '../useCrosshair';

describe(useCrosshair.name, () => {
  it('starts without a crosshair', () => {
    const { result } = renderCrosshair();

    expect(result.current.crosshairAt).toBeUndefined();
  });

  it('holds the crosshair back until the next frame', () => {
    const { result, frames } = renderCrosshair();

    act(() => result.current.scheduleCrosshair(100));
    const beforeTheFrame = result.current.crosshairAt;
    act(() => frames.runFrame());

    expect(beforeTheFrame).toBeUndefined();
    expect(result.current.crosshairAt).toBe(100);
  });

  it('asks for one frame however many moves come before it, and shows the last', () => {
    const { result, frames } = renderCrosshair();

    act(() => {
      result.current.scheduleCrosshair(100);
      result.current.scheduleCrosshair(200);
      result.current.scheduleCrosshair(300);
    });
    const requested = frames.pendingCount();
    act(() => frames.runFrame());

    expect(requested).toBe(1);
    expect(result.current.crosshairAt).toBe(300);
  });

  it('asks for a new frame for a move after the last frame ran', () => {
    const { result, frames } = renderCrosshair();
    act(() => result.current.scheduleCrosshair(100));
    act(() => frames.runFrame());

    act(() => result.current.scheduleCrosshair(200));
    act(() => frames.runFrame());

    expect(result.current.crosshairAt).toBe(200);
  });

  it('sets the crosshair at once, and drops a move that was waiting for a frame', () => {
    const { result, frames } = renderCrosshair();
    act(() => result.current.scheduleCrosshair(100));

    act(() => result.current.setCrosshair(undefined));
    const pendingAfterwards = frames.pendingCount();
    act(() => frames.runFrame());

    expect(pendingAfterwards).toBe(0);
    expect(result.current.crosshairAt).toBeUndefined();
  });

  it('shows a crosshair set at once without waiting for a frame', () => {
    const { result } = renderCrosshair();

    act(() => result.current.setCrosshair(500));

    expect(result.current.crosshairAt).toBe(500);
  });

  it('cancels the waiting frame when it goes away', () => {
    const { result, frames, unmount } = renderCrosshair();
    act(() => result.current.scheduleCrosshair(100));

    unmount();

    expect(frames.pendingCount()).toBe(0);
  });
});

function renderCrosshair() {
  const frames = createManualFrameTimers();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChartTimersContext.Provider value={frames.timers}>{children}</ChartTimersContext.Provider>
  );
  return { ...renderHook(() => useCrosshair(), { wrapper }), frames };
}
