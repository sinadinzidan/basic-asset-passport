import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusTone } from '../../../enums/statusTone';
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

  it('marks an active status with a check icon', () => {
    const { container } = render(<StatusPill status="Operating" tone={StatusTone.ACTIVE} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('Operating').closest('[data-tone]')).toHaveAttribute(
      'data-tone',
      'active',
    );
  });

  it('marks a neutral status with a dot instead of an icon', () => {
    const { container } = render(<StatusPill status="IN SERVICE" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('marks a warning status with a dot and its own tone', () => {
    const { container } = render(
      <StatusPill status="Under maintenance" tone={StatusTone.WARNING} />,
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByText('Under maintenance').closest('[data-tone]')).toHaveAttribute(
      'data-tone',
      'warning',
    );
  });
});
