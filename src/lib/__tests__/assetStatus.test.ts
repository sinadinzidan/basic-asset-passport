import { describe, expect, it } from 'vitest';

import { StatusTone } from '../../enums/statusTone';
import { getStatusTone, isOperatingStatus } from '../assetStatus';

describe(isOperatingStatus.name, () => {
  it.each(['Operating', 'operating', '  OPERATING  '])('treats %j as operating', (status) => {
    expect(isOperatingStatus(status)).toBe(true);
  });

  it.each(['IN SERVICE', 'Not operating', '', null])('treats %j as not operating', (status) => {
    expect(isOperatingStatus(status)).toBe(false);
  });
});

describe(getStatusTone.name, () => {
  it('lights an operating status', () => {
    expect(getStatusTone(' Operating ')).toBe(StatusTone.ACTIVE);
  });

  it.each(['Under maintenance', 'MAINTENANCE', 'In maintenance'])('warns for %j', (status) => {
    expect(getStatusTone(status)).toBe(StatusTone.WARNING);
  });

  it.each(['Decommissioned', 'IN SERVICE', '', null])('mutes %j', (status) => {
    expect(getStatusTone(status)).toBe(StatusTone.NEUTRAL);
  });
});
