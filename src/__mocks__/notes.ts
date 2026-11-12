import type { AssetNote } from '../types/note';

export function makeAssetNote(overrides: Partial<AssetNote> = {}): AssetNote {
  return {
    space: 'sp-asset-passport-data',
    externalId: 'note-1',
    title: 'Seal inspection',
    body: 'Mechanical seal checked, no leaks.',
    author: 'Sam Operator',
    createdTime: new Date(2026, 10, 5, 12).getTime(),
    ...overrides,
  };
}
