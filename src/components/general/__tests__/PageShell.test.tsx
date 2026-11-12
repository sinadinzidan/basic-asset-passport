import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageShell } from '../PageShell';

describe(PageShell.name, () => {
  it('shows the page inside the main landmark', () => {
    render(
      <PageShell>
        <p>Page content</p>
      </PageShell>,
    );

    expect(screen.getByRole('main')).toContainElement(screen.getByText('Page content'));
  });
});
