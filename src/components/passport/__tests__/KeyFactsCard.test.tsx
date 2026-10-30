import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KeyFactsCard } from '../KeyFactsCard';

describe('KeyFactsCard', () => {
  it('shows only the identifying specifications', () => {
    render(<KeyFactsCard specifications={[{ label: 'Manufacturer', value: 'ABB' }, { label: 'Class', value: 'Motor' }, { label: 'Tag number', value: 'T-1' }]} />);
    expect(screen.getByRole('heading', { name: 'Key facts' })).toBeInTheDocument();
    expect(screen.getByText('ABB')).toBeInTheDocument();
    expect(screen.getByText('T-1')).toBeInTheDocument();
    expect(screen.queryByText('Motor')).not.toBeInTheDocument();
  });

  it('renders nothing when there are no key facts', () => {
    const { container } = render(<KeyFactsCard specifications={[{ label: 'Source id', value: 'WMT:1' }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
