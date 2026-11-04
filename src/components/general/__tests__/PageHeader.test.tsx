import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '../PageHeader';

describe(PageHeader.name, () => {
  it('shows the title as the page heading', () => {
    render(<PageHeader title="Asset register" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Asset register' }),
    ).toBeInTheDocument();
  });

  it('shows the description only when given', () => {
    const { rerender } = render(<PageHeader title="Title" />);
    expect(screen.queryByText('About this page')).not.toBeInTheDocument();

    rerender(<PageHeader title="Title" description="About this page" />);

    expect(screen.getByText('About this page')).toBeInTheDocument();
  });

  it('shows leading content before the title and badges after it', () => {
    render(
      <PageHeader
        title="Title"
        leading={<button>Back</button>}
        badges={<span>Badge</span>}
      />,
    );

    const heading = screen.getByRole('heading', { name: 'Title' });
    expect(heading.previousElementSibling).toHaveTextContent('Back');
    expect(heading.nextElementSibling).toHaveTextContent('Badge');
  });

  it('pushes the badges to the right edge of the header', () => {
    render(<PageHeader title="Title" badges={<span>Badge</span>} />);

    expect(screen.getByText('Badge').parentElement).toHaveClass('ml-auto');
  });

  it('renders no badge area when there are no badges', () => {
    render(<PageHeader title="Title" />);

    expect(
      screen.getByRole('heading', { name: 'Title' }).nextElementSibling,
    ).toBeNull();
  });
});
