import { describe, expect, it } from 'vitest';

import { createHoverState } from '../hoverState';

describe(createHoverState.name, () => {
  it('has nothing to pick until the pointer moves', () => {
    expect(createHoverState().takePendingPoint()).toBeNull();
  });

  it('hands out the latest pointer position once', () => {
    const state = createHoverState();

    state.pointerMoved(1, 2);
    state.pointerMoved(30, 40);

    expect(state.takePendingPoint()).toEqual({ x: 30, y: 40 });
    expect(state.takePendingPoint()).toBeNull();
  });

  it('reports a change only when the hovered element differs', () => {
    const state = createHoverState();

    expect(state.setHovered(7)).toBe(true);
    expect(state.setHovered(7)).toBe(false);
    expect(state.setHovered(null)).toBe(true);
    expect(state.setHovered(null)).toBe(false);
  });

  it('remembers the hovered element', () => {
    const state = createHoverState();

    state.setHovered(7);

    expect(state.hovered).toBe(7);
  });

  it('drops the pending position and the highlight when the pointer leaves', () => {
    const state = createHoverState();

    state.pointerMoved(1, 2);
    state.setHovered(7);

    expect(state.pointerLeft()).toBe(true);
    expect(state.takePendingPoint()).toBeNull();
    expect(state.hovered).toBeNull();
  });

  it('has nothing to clear when the pointer leaves with no highlight', () => {
    expect(createHoverState().pointerLeft()).toBe(false);
  });

  it('asks for a new pick at the same place when the view changes under it', () => {
    const state = createHoverState();

    state.pointerMoved(5, 6);
    state.takePendingPoint();
    state.viewChanged();

    expect(state.takePendingPoint()).toEqual({ x: 5, y: 6 });
  });

  it('does not pick after the view changes when the pointer is outside', () => {
    const state = createHoverState();

    state.pointerMoved(5, 6);
    state.pointerLeft();
    state.viewChanged();

    expect(state.takePendingPoint()).toBeNull();
  });
});
