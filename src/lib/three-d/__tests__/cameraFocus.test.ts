import { describe, expect, it } from 'vitest';

import { easeInOut, focusPose } from '../cameraFocus';

describe(focusPose.name, () => {
  it('looks at the asset', () => {
    const pose = focusPose({ position: [0, 0, 10], target: [0, 0, 0] }, [5, 5, 5], 1);

    expect(pose.target).toEqual([5, 5, 5]);
  });

  it('keeps the viewing direction of the current camera', () => {
    const pose = focusPose({ position: [0, 0, 10], target: [0, 0, 0] }, [5, 5, 5], 1);

    expect(pose.position[0]).toBeCloseTo(5);
    expect(pose.position[1]).toBeCloseTo(5);
    expect(pose.position[2]).toBeGreaterThan(5);
  });

  it('stands further back from a bigger asset', () => {
    const small = focusPose({ position: [0, 0, 10], target: [0, 0, 0] }, [0, 0, 0], 1);
    const big = focusPose({ position: [0, 0, 10], target: [0, 0, 0] }, [0, 0, 0], 4);

    expect(big.position[2]).toBeGreaterThan(small.position[2]);
  });

  it('never gets closer than the minimum distance to a tiny asset', () => {
    const pose = focusPose({ position: [0, 0, 10], target: [0, 0, 0] }, [0, 0, 0], 0.0001);

    expect(pose.position[2]).toBeGreaterThanOrEqual(0.5);
  });
});

describe(easeInOut.name, () => {
  it('starts at zero and ends at one', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
  });

  it('is half way at the middle and clamps outside the range', () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});
