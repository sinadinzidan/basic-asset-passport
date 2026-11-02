import { describe, expect, it } from 'vitest';

import { AssetView } from '../../enums/assetView';
import { PassportTab } from '../../enums/passportTab';
import { parseInitialState, serializeAppState } from '../appState';

describe('parseInitialState', () => {
  it('returns an empty state for a link that is missing, not JSON or not an object', () => {
    for (const saved of [undefined, '', 'not json', 'null', '42', '"text"', '[]', '[{"assetPage":2}]']) {
      expect(parseInitialState(saved)).toEqual({});
    }
  });
  it('drops only the invalid fields and ignores unknown ones', () => {
    expect(parseInitialState('{"assetPage":-1,"assetSearch":"pump","unexpected":true,"selectedEquipmentId":7}')).toEqual({ assetSearch: 'pump' });
  });
  it('rejects a page number that is fractional or beyond the safe integer range', () => {
    expect(parseInitialState('{"assetPage":1.5}')).toEqual({});
    expect(parseInitialState('{"assetPage":1e21}')).toEqual({});
    expect(parseInitialState('{"assetPage":0}')).toEqual({ assetPage: 0 });
  });
  it('restores a passport tab and ignores unknown tabs', () => {
    expect(parseInitialState('{"passportTab":"documents"}')).toEqual({ passportTab: PassportTab.DOCUMENTS });
    expect(parseInitialState('{"passportTab":"unknown"}')).toEqual({});
  });
  it('ignores the removed signals tab and filters saved by older shared links', () => {
    expect(parseInitialState('{"passportTab":"measurements","measurements":{"scope":"asset","search":"temperature"}}')).toEqual({});
  });
  it('restores a supported page size and ignores other sizes', () => {
    expect(parseInitialState('{"assetPageSize":25}')).toEqual({ assetPageSize: 25 });
    expect(parseInitialState('{"assetPageSize":7}')).toEqual({});
    expect(parseInitialState('{"assetPageSize":"25"}')).toEqual({});
  });
  it('restores the grid view and ignores other views', () => {
    expect(parseInitialState('{"assetView":"grid"}')).toEqual({ assetView: AssetView.GRID });
    expect(parseInitialState('{"assetView":"list"}')).toEqual({});
  });
  it('restores a selected equipment id and ignores empty or non-text ids', () => {
    expect(parseInitialState('{"selectedEquipmentId":"[\\"energy\\",\\"M-1\\"]"}')).toEqual({ selectedEquipmentId: '["energy","M-1"]' });
    expect(parseInitialState('{"selectedEquipmentId":""}')).toEqual({});
    expect(parseInitialState('{"selectedEquipmentId":7}')).toEqual({});
  });
  it('ignores enum member names, which were never written to shared links', () => {
    expect(parseInitialState('{"passportTab":"DOCUMENTS","assetView":"GRID"}')).toEqual({});
  });
  it('writes the original stored values and keeps the other fields and their order', () => {
    const written = serializeAppState({ assetPage: 2, passportTab: PassportTab.OVERVIEW, assetView: AssetView.GRID, assetSearch: 'pump' });
    expect(written).toBe('{"assetPage":2,"passportTab":"overview","assetView":"grid","assetSearch":"pump"}');
    expect(serializeAppState({})).toBe('{}');
  });
  it('reads back what it wrote', () => {
    const state = { assetPage: 1, passportTab: PassportTab.DOCUMENTS, assetView: AssetView.GRID };
    expect(parseInitialState(serializeAppState(state))).toEqual(state);
  });
  it('restores a trimmed search alongside its page and ignores invalid searches', () => {
    expect(parseInitialState('{"assetSearch":"  pump  ","assetPage":2}')).toEqual({ assetSearch: 'pump', assetPage: 2 });
    expect(parseInitialState('{"assetSearch":42}')).toEqual({});
    expect(parseInitialState('{"assetSearch":"  "}')).toEqual({});
    expect(parseInitialState(JSON.stringify({ assetSearch: 'a'.repeat(257) }))).toEqual({});
  });
  it.each([undefined, '', 'not json', 'null', '[]', '{}', '{"assetPage":-1}', '{"assetPage":1.5}', '{"assetPage":"2"}'])(
    'defaults invalid host state to the first page: %s',
    (initialState) => {
      expect(parseInitialState(initialState)).toEqual({});
    }
  );

  it('restores the selected asset and page', () => {
    expect(parseInitialState('{"assetPage":2,"selectedAsset":{"space":"asset_data","externalId":"P-101","name":"Feed pump"}}')).toEqual({
      assetPage: 2,
      selectedAsset: { space: 'asset_data', externalId: 'P-101', name: 'Feed pump' },
    });
  });

  it('uses the external ID when the saved asset or file name is blank, and rejects blank identifiers', () => {
    expect(parseInitialState('{"selectedAsset":{"space":"assets","externalId":"P-101","name":"  "},"selectedFile":{"space":"files","externalId":"PID-1","name":""}}')).toEqual({
      selectedAsset: { space: 'assets', externalId: 'P-101', name: 'P-101' },
      selectedFile: { space: 'files', externalId: 'PID-1', name: 'PID-1' },
    });
    expect(parseInitialState('{"assetPage":1,"selectedAsset":{"space":"","externalId":"P-101","name":"Pump"}}')).toEqual({ assetPage: 1 });
    expect(parseInitialState('{"assetPage":1,"selectedAsset":{"space":"assets","externalId":"","name":"Pump"}}')).toEqual({ assetPage: 1 });
  });

  it('ignores malformed asset selections while preserving valid page state', () => {
    expect(parseInitialState('{"assetPage":2,"selectedAsset":{"externalId":"P-101"}}')).toEqual({ assetPage: 2 });
  });

  it('restores a file preview using its complete instance identity', () => {
    const state = {
      selectedAsset: { space: 'assets', externalId: 'P-101', name: 'Feed pump' },
      selectedFile: { space: 'files', externalId: 'PID-1', name: 'Plant P&ID' },
    };
    expect(parseInitialState(JSON.stringify(state))).toEqual(state);
  });

  it.each([
    { selectedFile: { space: 'files', externalId: 'PID-1', name: 'Plant P&ID' } },
    { selectedAsset: { space: 'assets', externalId: 'P-101', name: 'Pump' }, selectedFile: { externalId: 'PID-1' } },
  ])('ignores orphaned or malformed file selections', (state) => {
    expect(parseInitialState(JSON.stringify(state))).not.toHaveProperty('selectedFile');
  });
});
