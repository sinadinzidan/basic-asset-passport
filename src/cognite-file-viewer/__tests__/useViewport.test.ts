import { act, renderHook } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ViewportOptions } from '../useViewport';
import { computeBaseWidth, useViewport } from '../useViewport';

function attachViewport(options: ViewportOptions) {
  const hook = renderHook((props: ViewportOptions) => useViewport(props), { initialProps: options });
  const node = document.createElement('div');
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));
  act(() => hook.result.current.viewportRef(node));
  return { ...hook, node };
}

function wheel(node: HTMLElement, init: WheelEventInit): WheelEvent {
  const event = new WheelEvent('wheel', { cancelable: true, ...init });
  // Happy DOM does not copy the modifier keys or pointer position from the init dictionary.
  for (const key of ['ctrlKey', 'metaKey', 'clientX', 'clientY'] as const) {
    if (init[key] !== undefined) Object.defineProperty(event, key, { value: init[key] });
  }
  act(() => { node.dispatchEvent(event); });
  return event;
}

function touch(node: HTMLElement, type: string, points: Array<[number, number]>): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'touches', { value: points.map(([clientX, clientY]) => ({ clientX, clientY })) });
  act(() => { node.dispatchEvent(event); });
  return event;
}

function middleMouseDown(clientX: number, clientY: number, button: number = 1): ReactMouseEvent {
  return { button, clientX, clientY, preventDefault: vi.fn() } as Partial<ReactMouseEvent> as ReactMouseEvent;
}

describe('useViewport', () => {
  it('clamps zoom and clears effective pan when the document fits', () => {
    const { result } = renderHook(() => useViewport({}));
    act(() => result.current.handleZoomChange(10));
    expect(result.current.currentZoom).toBe(5);
    act(() => result.current.handlePanChange({ x: 10, y: 20 }));
    expect(result.current.effectivePan).toEqual({ x: 10, y: 20 });
    act(() => result.current.handleZoomChange(-1));
    expect(result.current.currentZoom).toBe(0.25);
    expect(result.current.effectivePan).toEqual({ x: 0, y: 0 });
  });

  it('zooms toward the cursor on Ctrl + wheel and keeps the point under the cursor fixed', () => {
    const onZoomChange = vi.fn();
    const onPanChange = vi.fn();
    const { node } = attachViewport({ zoom: 1, panOffset: { x: 0, y: 0 }, onZoomChange, onPanChange });
    const event = wheel(node, { ctrlKey: true, deltaY: -100, clientX: 100, clientY: 50 });
    expect(event.defaultPrevented).toBe(true);
    expect(onZoomChange).toHaveBeenCalledWith(expect.closeTo(1.1));
    const [pan] = onPanChange.mock.calls[0];
    expect(pan.x).toBeCloseTo(-10);
    expect(pan.y).toBeCloseTo(-5);
  });

  it('zooms out on Ctrl + wheel down, and does nothing when the zoom is already at its limit', () => {
    const onZoomChange = vi.fn();
    const { node, rerender } = attachViewport({ zoom: 1, onZoomChange });
    wheel(node, { metaKey: true, deltaY: 100 });
    expect(onZoomChange).toHaveBeenCalledWith(expect.closeTo(0.9));
    onZoomChange.mockClear();
    rerender({ zoom: 5, onZoomChange });
    wheel(node, { ctrlKey: true, deltaY: -100 });
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('pans with a plain wheel only while zoomed in', () => {
    const onPanChange = vi.fn();
    const { node, rerender } = attachViewport({ zoom: 1, panOffset: { x: 5, y: 5 }, onPanChange });
    expect(wheel(node, { deltaX: 10, deltaY: 20 }).defaultPrevented).toBe(false);
    expect(onPanChange).not.toHaveBeenCalled();
    rerender({ zoom: 2, panOffset: { x: 5, y: 5 }, onPanChange });
    expect(wheel(node, { deltaX: 10, deltaY: 20 }).defaultPrevented).toBe(true);
    expect(onPanChange).toHaveBeenCalledWith({ x: -5, y: -15 });
  });

  it('zooms with a two-finger pinch and ignores one-finger touches and a move without a start', () => {
    const onZoomChange = vi.fn();
    const onPanChange = vi.fn();
    const { node } = attachViewport({ zoom: 1, panOffset: { x: 0, y: 0 }, onZoomChange, onPanChange });
    touch(node, 'touchmove', [[0, 0], [100, 0]]);
    touch(node, 'touchstart', [[10, 10]]);
    expect(onZoomChange).not.toHaveBeenCalled();
    touch(node, 'touchstart', [[0, 0], [100, 0]]);
    const move = touch(node, 'touchmove', [[0, 0], [200, 0]]);
    expect(move.defaultPrevented).toBe(true);
    expect(onZoomChange).toHaveBeenLastCalledWith(2);
    expect(onPanChange).toHaveBeenCalled();
    touch(node, 'touchend', []);
    onZoomChange.mockClear();
    touch(node, 'touchmove', [[0, 0], [300, 0]]);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('drags with the middle mouse button while zoomed in and stops on release', () => {
    const onPanChange = vi.fn();
    const { result } = attachViewport({ zoom: 2, panOffset: { x: 10, y: 10 }, onPanChange });
    expect(result.current.cursor).toBe('grab');
    const down = middleMouseDown(100, 100);
    act(() => result.current.handleMouseDown(down));
    expect(down.preventDefault).toHaveBeenCalled();
    expect(result.current.cursor).toBe('grabbing');
    act(() => { window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130, clientY: 90 })); });
    expect(onPanChange).toHaveBeenLastCalledWith({ x: 40, y: 0 });
    act(() => { window.dispatchEvent(new MouseEvent('mouseup')); });
    expect(result.current.cursor).toBe('grab');
  });

  it('does not drag with the left button, or when the document fits', () => {
    const fitting = attachViewport({ zoom: 1 });
    act(() => fitting.result.current.handleMouseDown(middleMouseDown(0, 0)));
    expect(fitting.result.current.cursor).toBe('default');
    const zoomed = attachViewport({ zoom: 2 });
    const leftClick = middleMouseDown(0, 0, 0);
    act(() => zoomed.result.current.handleMouseDown(leftClick));
    expect(leftClick.preventDefault).not.toHaveBeenCalled();
    expect(zoomed.result.current.cursor).toBe('grab');
  });

  it('removes its listeners when the viewport node goes away', () => {
    const onZoomChange = vi.fn();
    const { node, result } = attachViewport({ zoom: 1, onZoomChange });
    act(() => result.current.viewportRef(null));
    wheel(node, { ctrlKey: true, deltaY: -100 });
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('fits width or a complete page into the container', () => {
    const container = { width: 800, height: 600 };
    expect(computeBaseWidth('width', undefined, container, null)).toBe(800);
    expect(computeBaseWidth('page', undefined, container, { width: 400, height: 800 })).toBe(300);
    expect(computeBaseWidth('page', undefined, container, { width: 1200, height: 600 })).toBe(800);
    expect(computeBaseWidth(undefined, 400, container, null)).toBe(400);
    expect(computeBaseWidth('width', 400, { width: 0, height: 0 }, null)).toBe(400);
    expect(computeBaseWidth('page', 400, container, null)).toBe(400);
  });
});
