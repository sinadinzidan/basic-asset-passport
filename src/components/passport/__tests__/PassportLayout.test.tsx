import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PassportTab } from '../../../enums/passportTab';
import { PassportLayout } from '../PassportLayout';

function renderLayout(props: Partial<Parameters<typeof PassportLayout>[0]> = {}) {
  const onTabChange = vi.fn();
  render(
    <PassportLayout hero={<h1>Hero</h1>} tabsLabel="Details" activeTab={PassportTab.OVERVIEW} onTabChange={onTabChange} directoryNote="Source note." {...props}>
      <p>Panel</p>
    </PassportLayout>,
  );
  return { onTabChange };
}

describe('PassportLayout', () => {
  it('shows the hero, both tabs with the document count, the panel and the footnote', () => {
    renderLayout({ documentsCount: 4 });
    expect(screen.getByRole('heading', { name: 'Hero' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents 4' })).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText(/Source note\. Read-only view of CDF data/)).toBeInTheDocument();
  });

  it('reports a tab change with the enum value', async () => {
    const { onTabChange } = renderLayout();
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Documents' }));
    expect(onTabChange).toHaveBeenCalledWith(PassportTab.DOCUMENTS);
  });

  it('adds a summary column only when given one, otherwise the tabs take the full width', () => {
    const { container } = render(
      <PassportLayout hero={null} tabsLabel="Details" activeTab={PassportTab.OVERVIEW} onTabChange={vi.fn()} directoryNote="N." aside={<p>Side</p>}>
        <p>Panel</p>
      </PassportLayout>,
    );
    expect(screen.getByRole('complementary', { name: 'Equipment summary' })).toHaveTextContent('Side');
    expect(container.querySelector('.lg\\:grid-cols-3')).not.toBeNull();
    renderLayout();
    expect(screen.getAllByRole('complementary')).toHaveLength(1);
  });
});
