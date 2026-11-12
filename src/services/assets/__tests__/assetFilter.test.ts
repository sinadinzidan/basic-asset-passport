import { describe, expect, it } from 'vitest';

import { matchAssetInList, matchAssetRelation } from '../assetFilter';

const view = { space: 'sp-model', externalId: 'Note', version: 'v1' };
const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(matchAssetRelation.name, () => {
  it('matches the nodes whose asset relation is the asset', () => {
    expect(matchAssetRelation(view, assetIdentifier)).toEqual({
      equals: {
        property: ['sp-model', 'Note/v1', 'asset'],
        value: { space: 'asset-space', externalId: 'FLOC-1' },
      },
    });
  });

  it('passes on only the identity of the asset', () => {
    const asset = { ...assetIdentifier, name: 'Pump' };

    expect(matchAssetRelation(view, asset)).toEqual(matchAssetRelation(view, assetIdentifier));
  });
});

describe(matchAssetInList.name, () => {
  it('matches the nodes whose relation list holds the asset', () => {
    expect(matchAssetInList(view, 'assets', assetIdentifier)).toEqual({
      containsAny: {
        property: ['sp-model', 'Note/v1', 'assets'],
        values: [{ space: 'asset-space', externalId: 'FLOC-1' }],
      },
    });
  });
});
