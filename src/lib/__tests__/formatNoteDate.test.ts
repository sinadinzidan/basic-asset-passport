import { describe, expect, it } from 'vitest';

import { formatNoteDate } from '../formatNoteDate';

describe(formatNoteDate.name, () => {
  it('formats a timestamp as a short date', () => {
    expect(formatNoteDate(new Date(2026, 10, 5, 12).getTime())).toBe(
      '5 Nov 2026',
    );
  });
});
