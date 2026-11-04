import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusPill } from '../StatusPill';

describe(StatusPill.name, () => {
  it('shows the trimmed status', () => {
    render(<StatusPill status="  IN SERVICE  " />);

    expect(screen.getByText('IN SERVICE')).toBeInTheDocument();
  });

  it.each([null, '', '   '])('says it is not provided for %j', (status) => {
    render(<StatusPill status={status} />);

    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('marks a success status with a check icon', () => {
    const { container } = render(
      <StatusPill status="Operating" tone="success" />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Operating')).toHaveClass(
      'bg-success-foreground-strong',
    );
  });

  it('marks a neutral status with a dot instead of an icon', () => {
    const { container } = render(<StatusPill status="IN SERVICE" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
