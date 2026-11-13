import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '../PageHeader';

describe(PageHeader.name, () => {
  it('shows the title as the page heading', () => {
    render(<PageHeader title="Asset register" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Asset register' })).toBeInTheDocument();
  });

  it('appears at once, without an entrance animation', () => {
    const { container } = render(<PageHeader title="Title" />);

    expect(container.firstElementChild).not.toHaveClass('page-enter');
  });

  it('shows the description only when given', () => {
    const { rerender } = render(<PageHeader title="Title" />);

    expect(screen.queryByText('About this page')).not.toBeInTheDocument();

    rerender(<PageHeader title="Title" description="About this page" />);

    expect(screen.getByText('About this page')).toBeInTheDocument();
  });

  it('shows leading content before the title and badges after it', () => {
    render(
      <PageHeader title="Title" leading={<button>Back</button>} badges={<span>Badge</span>} />,
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

    expect(screen.getByRole('heading', { name: 'Title' }).nextElementSibling).toBeNull();
  });

  it('shows a kicker above the title only when given', () => {
    const { rerender } = render(<PageHeader title="Title" />);

    expect(screen.queryByText('Asset intelligence')).not.toBeInTheDocument();

    rerender(<PageHeader title="Title" kicker="Asset intelligence" />);

    const kicker = screen.getByText('Asset intelligence');

    expect(kicker).toBeInTheDocument();
    expect(
      kicker.compareDocumentPosition(screen.getByRole('heading', { name: 'Title' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('sets the kicker on a label row: a diamond before it and a hairline after, both decorative', () => {
    render(<PageHeader title="Title" kicker="Asset intelligence" />);

    const kicker = screen.getByText('Asset intelligence');

    expect(kicker.parentElement).toHaveClass('label-row');
    expect(kicker.previousElementSibling).toHaveClass('hud-dot');
    expect(kicker.previousElementSibling).toHaveAttribute('aria-hidden', 'true');
    expect(kicker.nextElementSibling).toHaveClass('label-row__rule');
    expect(kicker.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives the heading the shared page title style', () => {
    render(<PageHeader title="Title" />);

    expect(screen.getByRole('heading', { name: 'Title' })).toHaveClass('page-title');
  });
});
