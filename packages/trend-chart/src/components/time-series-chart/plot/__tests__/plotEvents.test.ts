import { describe, expect, it } from 'vitest';

import { STATUS_COLORS } from '../../../general/charts/chartColors';
import { eventColor, eventTitle } from '../plotEvents';
import { EVENT_OTHER_COLOR } from '../plotLayout';

describe(eventColor.name, () => {
  it('uses the tone the host gave the event', () => {
    expect(eventColor({ id: 'e1', kind: 'alarm', tone: 'bad', at: 0, label: 'A-1' })).toBe(STATUS_COLORS.bad);
  });

  it('falls back to the neutral event colour when the host gave none', () => {
    expect(eventColor({ id: 'e1', kind: 'alarm', at: 0, label: 'A-1' })).toBe(EVENT_OTHER_COLOR);
  });
});

describe(eventTitle.name, () => {
  it('names the kind with the label the host gave it', () => {
    expect(eventTitle({ id: 'e1', kind: 'ALARM', kindLabel: 'Alarm', at: 0, label: 'A-1' })).toBe('Alarm A-1');
  });

  it('names the kind itself when the host gave no label', () => {
    expect(eventTitle({ id: 'e1', kind: 'inspection', at: 0, label: 'I-7' })).toBe('inspection I-7');
  });
});
