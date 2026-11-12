import { act, renderHook } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeBaseWidth, useViewport, type ViewportOptions } from '../useViewport';

describe(useViewport.name, () => {
  let viewport: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        disconnect(): void {}
      },
    );
    viewport = document.createElement('div');
    // Happy DOM does no layout, so give the viewport a size and some content to scroll.
    Object.defineProperty(viewport, 'clientWidth', { value: 400 });
    Object.defineProperty(viewport, 'clientHeight', { value: 300 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderViewport(options: ViewportOptions = {}) {
    const hook = renderHook(() => useViewport(options));
    act(() => hook.result.current.viewportRef(viewport));
    return hook;
  }

  function press(
    hook: ReturnType<typeof renderViewport>,
    init: { button?: number; x: number; y: number },
  ): ReactMouseEvent {
    const event = {
      button: init.button ?? 0,
      clientX: init.x,
      clientY: init.y,
      preventDefault: vi.fn(),
    } as Partial<ReactMouseEvent> as ReactMouseEvent;
    act(() => hook.result.current.handleMouseDown(event));
    return event;
  }

  function move(x: number, y: number): void {
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
    });
  }

  function release(): void {
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  }

  it('pans a zoomed-in page by pressing the left button and moving', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, onPanChange });

    press(hook, { x: 100, y: 100 });
    move(130, 90);

    expect(onPanChange).toHaveBeenLastCalledWith({ x: 30, y: -10 });
  });

  it('still pans with the middle button', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, onPanChange });

    press(hook, { button: 1, x: 0, y: 0 });
    move(5, 5);

    expect(onPanChange).toHaveBeenLastCalledWith({ x: 5, y: 5 });
  });

  it('does not start a drag with the right button', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, onPanChange });

    const event = press(hook, { button: 2, x: 0, y: 0 });
    move(5, 5);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onPanChange).not.toHaveBeenCalled();
  });

  it('continues from where the last drag ended', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, panOffset: { x: 40, y: 0 }, onPanChange });

    press(hook, { x: 10, y: 10 });
    move(20, 10);

    expect(onPanChange).toHaveBeenLastCalledWith({ x: 50, y: 0 });
  });

  it('stops panning when the button is released', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, onPanChange });
    press(hook, { x: 0, y: 0 });
    move(10, 0);
    release();
    onPanChange.mockClear();

    move(50, 0);

    expect(onPanChange).not.toHaveBeenCalled();
  });

  it('scrolls the page by dragging when it is not zoomed in', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 1, onPanChange });
    viewport.scrollTop = 200;
    viewport.scrollLeft = 50;

    press(hook, { x: 100, y: 100 });
    move(80, 60);

    expect(viewport.scrollLeft).toBe(70);
    expect(viewport.scrollTop).toBe(240);
    expect(onPanChange).not.toHaveBeenCalled();
  });

  it('leaves the scrollbar to the browser', () => {
    const hook = renderViewport({ zoom: 1 });

    // The pointer is right of the content area, where the vertical scrollbar is.
    const event = press(hook, { x: 410, y: 100 });

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('shows a grab cursor, and a grabbing one while dragging', () => {
    const hook = renderViewport({ zoom: 2 });
    expect(hook.result.current.cursor).toBe('grab');

    press(hook, { x: 0, y: 0 });

    expect(hook.result.current.cursor).toBe('grabbing');
  });
  function wheel(init: WheelEventInit): WheelEvent {
    const event = new WheelEvent('wheel', { cancelable: true, ...init });
    // Happy DOM drops the modifier keys and the pointer position of a wheel event, so set them.
    Object.defineProperty(event, 'clientX', { value: init.clientX ?? 0 });
    Object.defineProperty(event, 'clientY', { value: init.clientY ?? 0 });
    Object.defineProperty(event, 'ctrlKey', { value: init.ctrlKey === true });
    Object.defineProperty(event, 'metaKey', { value: init.metaKey === true });
    act(() => {
      viewport.dispatchEvent(event);
    });
    return event;
  }

  function touch(type: string, points: { x: number; y: number }[]): Event {
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, 'touches', {
      value: points.map(({ x, y }) => ({ clientX: x, clientY: y })),
    });
    act(() => {
      viewport.dispatchEvent(event);
    });
    return event;
  }

  it('measures the viewport it is given', () => {
    const hook = renderViewport();

    expect(hook.result.current.containerDims).toEqual({ width: 400, height: 300 });
  });

  it('keeps its own zoom within the limits when nothing controls it', () => {
    const onZoomChange = vi.fn();
    const hook = renderViewport({ minZoom: 0.5, maxZoom: 3, onZoomChange });

    act(() => hook.result.current.handleZoomChange(10));
    expect(hook.result.current.currentZoom).toBe(3);

    act(() => hook.result.current.handleZoomChange(0.1));
    expect(hook.result.current.currentZoom).toBe(0.5);
    expect(onZoomChange.mock.calls).toEqual([[3], [0.5]]);
  });

  it('keeps its own pan, and shows none until it is zoomed in', () => {
    const hook = renderViewport();

    act(() => hook.result.current.handlePanChange({ x: 10, y: 20 }));
    expect(hook.result.current.effectivePan).toEqual({ x: 0, y: 0 });

    act(() => hook.result.current.handleZoomChange(2));
    expect(hook.result.current.effectivePan).toEqual({ x: 10, y: 20 });
  });

  it('zooms toward the pointer with Ctrl and the wheel', () => {
    const onZoomChange = vi.fn();
    const onPanChange = vi.fn();
    renderViewport({ zoom: 2, onZoomChange, onPanChange });

    const event = wheel({ ctrlKey: true, deltaY: -1, clientX: 100, clientY: 50 });

    expect(event.defaultPrevented).toBe(true);
    expect(onZoomChange.mock.lastCall?.[0]).toBeCloseTo(2.2);
    const [pan] = onPanChange.mock.lastCall ?? [];
    expect(pan.x).toBeCloseTo(-10);
    expect(pan.y).toBeCloseTo(-5);
  });

  it('zooms out with Cmd and the wheel the other way', () => {
    const onZoomChange = vi.fn();
    renderViewport({ zoom: 2, onZoomChange });

    wheel({ metaKey: true, deltaY: 1 });

    expect(onZoomChange.mock.lastCall?.[0]).toBeCloseTo(1.8);
  });

  it('does not zoom past the limit', () => {
    const onZoomChange = vi.fn();
    renderViewport({ zoom: 5, onZoomChange });

    const event = wheel({ ctrlKey: true, deltaY: -1 });

    expect(event.defaultPrevented).toBe(true);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('pans a zoomed-in page with the wheel', () => {
    const onPanChange = vi.fn();
    renderViewport({ zoom: 2, panOffset: { x: 5, y: 5 }, onPanChange });

    const event = wheel({ deltaX: 10, deltaY: 20 });

    expect(event.defaultPrevented).toBe(true);
    expect(onPanChange).toHaveBeenLastCalledWith({ x: -5, y: -15 });
  });

  it('leaves the wheel to the browser when it is not zoomed in', () => {
    const onPanChange = vi.fn();
    renderViewport({ zoom: 1, onPanChange });

    const event = wheel({ deltaY: 20 });

    expect(event.defaultPrevented).toBe(false);
    expect(onPanChange).not.toHaveBeenCalled();
  });

  it('zooms and pans with a two-finger pinch', () => {
    const onZoomChange = vi.fn();
    const onPanChange = vi.fn();
    renderViewport({ zoom: 1, onZoomChange, onPanChange });

    const start = touch('touchstart', [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ]);
    touch('touchmove', [
      { x: 60, y: 100 },
      { x: 260, y: 100 },
    ]);

    expect(start.defaultPrevented).toBe(true);
    expect(onZoomChange).toHaveBeenLastCalledWith(2);
    expect(onPanChange).toHaveBeenLastCalledWith({ x: -140, y: -100 });
  });

  it('ignores a single finger, and a move after the fingers are lifted', () => {
    const onZoomChange = vi.fn();
    renderViewport({ zoom: 1, onZoomChange });
    const twoFingers = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    const single = touch('touchstart', [{ x: 0, y: 0 }]);
    touch('touchmove', twoFingers);
    touch('touchstart', twoFingers);
    touch('touchend', []);
    touch('touchmove', twoFingers);

    expect(single.defaultPrevented).toBe(false);
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('stops listening once the viewport is taken away', () => {
    const onPanChange = vi.fn();
    const hook = renderViewport({ zoom: 2, onPanChange });

    act(() => hook.result.current.viewportRef(null));
    wheel({ deltaY: 20 });
    press(hook, { x: 0, y: 0 });

    expect(onPanChange).not.toHaveBeenCalled();
    expect(hook.result.current.cursor).toBe('grab');
  });
});

describe(computeBaseWidth.name, () => {
  const container = { width: 400, height: 300 };

  it('uses the width it is given when there is no fit mode or no measured container', () => {
    expect(computeBaseWidth(undefined, 250, container, null)).toBe(250);
    expect(computeBaseWidth('width', 250, { width: 0, height: 0 }, null)).toBe(250);
  });

  it('fills the container width in width mode', () => {
    expect(computeBaseWidth('width', 250, container, null)).toBe(400);
  });

  it('fits a tall page to the container height in page mode', () => {
    expect(computeBaseWidth('page', undefined, container, { width: 300, height: 600 })).toBe(150);
  });

  it('fits a wide page to the container width in page mode', () => {
    expect(computeBaseWidth('page', undefined, container, { width: 800, height: 200 })).toBe(400);
  });

  it('falls back to the given width in page mode until the page is measured', () => {
    expect(computeBaseWidth('page', 250, container, null)).toBe(250);
    expect(computeBaseWidth('page', 250, container, { width: 300, height: 0 })).toBe(250);
  });
});
