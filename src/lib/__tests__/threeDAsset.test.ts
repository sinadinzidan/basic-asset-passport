import { describe, expect, it } from 'vitest';

import { MODEL } from '../../config/model';
import type { AssetInstanceDetails } from '../../types/asset';
import { hasThreeDModel } from '../threeDAsset';

describe(hasThreeDModel.name, () => {
  it('is true for an asset of the Ruwais plant', () => {
    expect(hasThreeDModel(makeAsset('Ruwais'))).toBe(true);
  });

  it('ignores case and surrounding spaces', () => {
    expect(hasThreeDModel(makeAsset(' RUWAIS '))).toBe(true);
  });

  it('is false for another plant', () => {
    expect(hasThreeDModel(makeAsset('North Plant'))).toBe(false);
  });

  it('is false when the plant is missing', () => {
    expect(hasThreeDModel({ space: 's', externalId: 'a', properties: [] })).toBe(false);
    expect(hasThreeDModel(undefined)).toBe(false);
  });
});

function makeAsset(plantName: string): AssetInstanceDetails {
  return {
    space: 's',
    externalId: 'a',
    properties: [
      { identifier: MODEL.properties.asset.plantName, label: 'Plant', value: plantName },
    ],
  };
}
