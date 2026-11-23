import { MOUSE, TOUCH } from 'three';
import { describe, expect, it } from 'vitest';

import { ThreeDInteractionMode } from '../../../enums/threeDInteractionMode';
import { applyInteractionMode, type GestureBindings } from '../interactionMode';

describe(applyInteractionMode.name, () => {
  it('orbits with the left button and one finger in orbit mode', () => {
    const controls = makeControls();

    applyInteractionMode(controls, ThreeDInteractionMode.ORBIT);

    expect(controls.mouseButtons.LEFT).toBe(MOUSE.ROTATE);
    expect(controls.touches.ONE).toBe(TOUCH.ROTATE);
  });

  it('moves with the left button and one finger in move mode', () => {
    const controls = makeControls();

    applyInteractionMode(controls, ThreeDInteractionMode.MOVE);

    expect(controls.mouseButtons.LEFT).toBe(MOUSE.PAN);
    expect(controls.touches.ONE).toBe(TOUCH.PAN);
  });

  it.each([ThreeDInteractionMode.ORBIT, ThreeDInteractionMode.MOVE])(
    'keeps pinch zoom, two finger move, the wheel and the right button in %s mode',
    (mode) => {
      const controls = makeControls();

      applyInteractionMode(controls, mode);

      expect(controls.touches.TWO).toBe(TOUCH.DOLLY_PAN);
      expect(controls.mouseButtons.MIDDLE).toBe(MOUSE.DOLLY);
      expect(controls.mouseButtons.RIGHT).toBe(
        mode === ThreeDInteractionMode.ORBIT ? MOUSE.PAN : MOUSE.ROTATE,
      );
    },
  );
});

function makeControls(): GestureBindings {
  return { mouseButtons: {}, touches: {} };
}
