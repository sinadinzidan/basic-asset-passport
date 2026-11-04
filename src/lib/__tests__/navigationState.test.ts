import { describe, expect, it } from 'vitest';

import { AssetEquipmentTab } from '../../enums/assetEquipmentTab';
import {
  DEFAULT_NAVIGATION_STATE,
  parseNavigationState,
} from '../navigationState';

describe(parseNavigationState.name, () => {
  const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };

  it('restores a valid selection and tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });
  });

  it('falls back to the properties tab for an unknown tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: 'unknown',
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    });
  });

  it('drops a selection that is not an asset identifier', () => {
    const initialState = JSON.stringify({ selectedAsset: { space: 1 } });

    expect(parseNavigationState(initialState).selectedAsset).toBeNull();
  });

  it.each([undefined, '', 'not json', '[]', 'null', '"text"'])(
    'returns the default state for %j',
    (initialState) => {
      expect(parseNavigationState(initialState)).toEqual(
        DEFAULT_NAVIGATION_STATE,
      );
    },
  );
});
