import { describe, expect, it } from 'vitest';

import { isRecord } from '../isRecord';

describe(isRecord.name, () => {
  it('accepts an object', () => {
    expect(isRecord({ name: 'Pump' })).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a list', ['Pump']],
    ['text', 'Pump'],
    ['a number', 12],
  ])('rejects %s', (_case, value) => {
    expect(isRecord(value)).toBe(false);
  });
});
