import { describe, expect, it } from 'vitest';

import { zoomedPosition } from '../cameraZoom';

describe(zoomedPosition.name, () => {
  it('moves the camera towards the target when the factor is below one', () => {
    expect(zoomedPosition([10, 0, 0], [0, 0, 0], 0.5)).toEqual([5, 0, 0]);
  });

  it('moves the camera away from the target when the factor is above one', () => {
    expect(zoomedPosition([0, 4, 0], [0, 2, 0], 2)).toEqual([0, 6, 0]);
  });

  it('keeps the direction of the camera as seen from the target', () => {
    expect(zoomedPosition([3, 5, 7], [1, 1, 1], 1)).toEqual([3, 5, 7]);
  });
});
