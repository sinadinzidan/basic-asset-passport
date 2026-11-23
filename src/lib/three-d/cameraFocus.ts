import {
  DEGREES_PER_HALF_TURN,
  THREE_D_CAMERA_FIELD_OF_VIEW,
  THREE_D_FOCUS_MARGIN,
  THREE_D_FOCUS_MIN_DISTANCE,
} from '../../constants/threeD';
import type { Vector } from '../../types/threeD';

export type CameraPose = { position: Vector; target: Vector };

const HALF = 0.5;
const EASE_POWER = 3;
const EASE_SCALE = 4;
const EASE_MIRROR = 2;

export function focusPose(current: CameraPose, anchor: Vector, radius: number): CameraPose {
  const offset = [
    current.position[0] - current.target[0],
    current.position[1] - current.target[1],
    current.position[2] - current.target[2],
  ] as const;

  const length = Math.hypot(...offset) || 1;

  const distance = Math.max(
    (radius / Math.sin((THREE_D_CAMERA_FIELD_OF_VIEW * HALF * Math.PI) / DEGREES_PER_HALF_TURN)) *
      THREE_D_FOCUS_MARGIN,
    THREE_D_FOCUS_MIN_DISTANCE,
  );

  return {
    target: anchor,
    position: [
      anchor[0] + (offset[0] / length) * distance,
      anchor[1] + (offset[1] / length) * distance,
      anchor[2] + (offset[2] / length) * distance,
    ],
  };
}

export function easeInOut(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return clamped < HALF
    ? EASE_SCALE * clamped ** EASE_POWER
    : 1 - (-EASE_MIRROR * clamped + EASE_MIRROR) ** EASE_POWER / EASE_MIRROR;
}
