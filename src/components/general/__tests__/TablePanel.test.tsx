import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TablePanel } from '../TablePanel';

describe('TablePanel', () => {
  it('puts the toolbar above and the footer below the content in one labelled region', () => {
    render(<TablePanel aria-label="Assets" toolbar={<p>Toolbar</p>} footer={<p>Footer</p>}><p>Content</p></TablePanel>);
    const region = screen.getByRole('region', { name: 'Assets' });
    expect(region.textContent).toBe('ToolbarContentFooter');
  });

  it('omits the toolbar and footer when they are not given', () => {
    render(<TablePanel aria-label="Assets"><p>Content</p></TablePanel>);
    expect(screen.getByRole('region', { name: 'Assets' }).children).toHaveLength(1);
  });
});
