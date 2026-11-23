import { describe, expect, it } from 'vitest';

import { EMPTY_THREE_D_PROGRESS } from '../../../hooks/three-d/useThreeDLoadProgress';
import type { ThreeDLoadProgress } from '../../../types/threeD';
import {
  formatThreeDProgress,
  formatUnsupportedShapes,
  isThreeDLoadingDone,
} from '../progressMessage';

describe(formatThreeDProgress.name, () => {
  it('counts the parts that are done', () => {
    expect(formatThreeDProgress(progress({ loadedSectors: 3, totalSectors: 10 }))).toBe(
      '3 of 10 parts',
    );
  });

  it('adds failed and skipped parts', () => {
    expect(
      formatThreeDProgress(
        progress({ loadedSectors: 5, failedSectors: 2, skippedSectors: 1, totalSectors: 10 }),
      ),
    ).toBe('8 of 10 parts, 2 failed, 1 skipped');
  });
});

describe(formatUnsupportedShapes.name, () => {
  it('lists the unsupported shapes with counts', () => {
    expect(formatUnsupportedShapes(progress({ unsupported: { Foo: 2, Bar: 1 } }))).toBe(
      'Foo: 2, Bar: 1',
    );
  });

  it('says nothing when everything is supported', () => {
    expect(formatUnsupportedShapes(progress())).toBeNull();
  });
});

describe(isThreeDLoadingDone.name, () => {
  it('is done when every part is loaded, failed or skipped', () => {
    expect(
      isThreeDLoadingDone(progress({ loadedSectors: 2, failedSectors: 1, totalSectors: 3 })),
    ).toBe(true);
  });

  it('is not done while parts remain', () => {
    expect(isThreeDLoadingDone(progress({ loadedSectors: 1, totalSectors: 3 }))).toBe(false);
  });

  it('is not done before the total is known', () => {
    expect(isThreeDLoadingDone(progress())).toBe(false);
  });
});

function progress(overrides: Partial<ThreeDLoadProgress> = {}): ThreeDLoadProgress {
  return { ...EMPTY_THREE_D_PROGRESS, ...overrides };
}
