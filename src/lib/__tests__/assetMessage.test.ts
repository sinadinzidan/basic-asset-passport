import { describe, expect, it } from 'vitest';

import { formatEquipmentTruncatedMessage, formatNoMatchingAssetsMessage } from '../assetMessage';

describe(formatNoMatchingAssetsMessage.name, () => {
  it('names the text that was searched for', () => {
    expect(formatNoMatchingAssetsMessage('zzz')).toBe(
      'No asset matches "zzz". Try a different name, description or plant.',
    );
  });
});

describe(formatEquipmentTruncatedMessage.name, () => {
  it('gives the number shown with a thousands separator', () => {
    expect(formatEquipmentTruncatedMessage(1000)).toBe(
      'Showing the first 1,000 equipment, sorted by name. This asset has more.',
    );
  });
});
