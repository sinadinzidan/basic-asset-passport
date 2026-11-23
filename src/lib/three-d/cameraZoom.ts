import type { Vector } from '../../types/threeD';

export function zoomedPosition(position: Vector, target: Vector, factor: number): Vector {
  return [
    target[0] + (position[0] - target[0]) * factor,
    target[1] + (position[1] - target[1]) * factor,
    target[2] + (position[2] - target[2]) * factor,
  ];
}
