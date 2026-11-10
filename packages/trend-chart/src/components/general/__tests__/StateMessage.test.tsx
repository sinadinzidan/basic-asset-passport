import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StateMessage } from '../StateMessage';

describe(StateMessage.name, () => {
  it('shows the title and the explanation as a status', () => {
    render(<StateMessage title="No TFNs match" description="Adjust the filters." />);

    expect(screen.getByRole('status')).toHaveTextContent('No TFNs match');
    expect(screen.getByText('Adjust the filters.')).toBeInTheDocument();
  });

  it('gives a page-sized message its title as a heading, and an inline one plain text', () => {
    const { rerender } = render(<StateMessage title="No ARNs found" />);
    expect(screen.getByRole('heading', { name: 'No ARNs found' })).toBeInTheDocument();
    rerender(<StateMessage title="No ARNs found" size="inline" />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('announces an error as an alert and offers its action', () => {
    render(<StateMessage variant="error" title="Could not load" action={<button type="button">Retry</button>} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('leaves out the explanation and the action when there are none', () => {
    render(<StateMessage title="Nothing here" size="inline" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Nothing here').closest('div')?.querySelectorAll('p')).toHaveLength(1);
  });

  it('marks the variant so a theme can tint it', () => {
    render(<StateMessage variant="noAccess" title="Not allowed" />);

    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'noAccess');
  });
});
