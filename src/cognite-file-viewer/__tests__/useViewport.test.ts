import { act, renderHook } from '@testing-library/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useViewport, type ViewportOptions } from '../useViewport';

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
});
