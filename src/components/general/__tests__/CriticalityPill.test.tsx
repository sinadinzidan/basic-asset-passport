import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CriticalityPill } from '../CriticalityPill';

describe(CriticalityPill.name, () => {
  it('shows the criticality as given, without a repeated label', () => {
    render(<CriticalityPill criticality="A - High criticality" />);

    expect(screen.getByText('A - High criticality')).toBeInTheDocument();
    expect(screen.queryByText(/^Criticality/)).not.toBeInTheDocument();
  });

  it.each([
    ['A - High criticality', 'error'],
    ['B - Medium criticality', 'warning'],
    ['C - Low criticality', 'info'],
    ['Unknown', 'neutral'],
  ] as const)('marks "%s" with the %s tone', (criticality, tone) => {
    render(<CriticalityPill criticality={criticality} />);

    expect(
      screen.getByText(criticality).closest('[data-tone]'),
    ).toHaveAttribute('data-tone', tone);
  });
});
