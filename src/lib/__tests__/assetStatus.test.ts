import { describe, expect, it } from 'vitest';

import { isOperatingStatus } from '../assetStatus';

describe(isOperatingStatus.name, () => {
  it.each(['Operating', 'operating', '  OPERATING  '])(
    'treats %j as operating',
    (status) => {
      expect(isOperatingStatus(status)).toBe(true);
    },
  );

  it.each(['IN SERVICE', 'Not operating', '', null])(
    'treats %j as not operating',
    (status) => {
      expect(isOperatingStatus(status)).toBe(false);
    },
  );
});
