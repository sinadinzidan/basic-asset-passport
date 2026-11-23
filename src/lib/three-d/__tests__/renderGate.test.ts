import { describe, expect, it } from 'vitest';

import { createRenderGate } from '../renderGate';

describe(createRenderGate.name, () => {
  it('asks for the first frame', () => {
    const gate = createRenderGate();

    expect(gate.consume(false)).toBe(true);
  });

  it('skips frames while nothing has changed', () => {
    const gate = createRenderGate();

    gate.consume(false);

    expect(gate.consume(false)).toBe(false);
  });

  it('asks for a frame after the scene is marked dirty, once', () => {
    const gate = createRenderGate();

    gate.consume(false);
    gate.markDirty();

    expect(gate.consume(false)).toBe(true);
    expect(gate.consume(false)).toBe(false);
  });

  it('asks for a frame while the camera controls are moving', () => {
    const gate = createRenderGate();

    gate.consume(false);

    expect(gate.consume(true)).toBe(true);
  });
});
