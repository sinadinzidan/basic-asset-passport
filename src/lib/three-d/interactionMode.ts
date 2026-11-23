import { MOUSE, TOUCH } from 'three';

import { ThreeDInteractionMode } from '../../enums/threeDInteractionMode';

export type GestureBindings = {
  mouseButtons: { LEFT?: MOUSE | null; MIDDLE?: MOUSE | null; RIGHT?: MOUSE | null };
  touches: { ONE?: TOUCH | null; TWO?: TOUCH | null };
};

export function applyInteractionMode(controls: GestureBindings, mode: ThreeDInteractionMode): void {
  const isOrbit = mode === ThreeDInteractionMode.ORBIT;

  controls.mouseButtons.LEFT = isOrbit ? MOUSE.ROTATE : MOUSE.PAN;
  controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
  controls.mouseButtons.RIGHT = isOrbit ? MOUSE.PAN : MOUSE.ROTATE;
  controls.touches.ONE = isOrbit ? TOUCH.ROTATE : TOUCH.PAN;
  controls.touches.TWO = TOUCH.DOLLY_PAN;
}
