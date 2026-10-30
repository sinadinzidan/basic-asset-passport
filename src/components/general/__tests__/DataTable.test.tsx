import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable';

type Row = { id: string; name: string; note?: string };

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', isRowHeader: true, cell: (row) => row.name },
  { id: 'note', header: 'Note', hideBelow: 'md', cell: (row) => row.note ?? 'None' },
  { id: 'open', header: 'Open row', hideHeader: true, cell: () => '>' },
];
const rows: Row[] = [{ id: 'a', name: 'Alpha', note: 'First' }, { id: 'b', name: 'Beta' }];

describe('DataTable', () => {
  it('renders a captioned table with column headers, row headers and cells', () => {
    render(<DataTable caption="Letters" columns={columns} rows={rows} getRowId={(row) => row.id} />);
    expect(screen.getByRole('table', { name: 'Letters' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Name', 'Note', 'Open row']);
    expect(screen.getAllByRole('rowheader').map((header) => header.textContent)).toEqual(['Alpha', 'Beta']);
    expect(within(screen.getAllByRole('row')[2]).getByText('None')).toBeInTheDocument();
  });

  it('hides a column below its breakpoint and keeps a hidden header for assistive tech', () => {
    render(<DataTable caption="Letters" columns={columns} rows={rows} getRowId={(row) => row.id} />);
    expect(screen.getByRole('columnheader', { name: 'Note' })).toHaveClass('hidden', 'md:table-cell');
    expect(screen.getByText('Open row')).toHaveClass('sr-only');
  });

  it('calls onRowClick with the clicked row and marks rows as clickable', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable caption="Letters" columns={columns} rows={rows} getRowId={(row) => row.id} onRowClick={onRowClick} />);
    await user.click(screen.getByText('Beta'));
    expect(onRowClick).toHaveBeenCalledExactlyOnceWith(rows[1]);
    expect(screen.getAllByRole('row')[1]).toHaveClass('cursor-pointer');
  });

  it('only makes rows clickable when isRowClickable allows it', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable caption="Letters" columns={columns} rows={rows} getRowId={(row) => row.id} onRowClick={onRowClick} isRowClickable={(row) => row.id === 'a'} />);
    await user.click(screen.getByText('Beta'));
    expect(onRowClick).not.toHaveBeenCalled();
    expect(screen.getAllByRole('row')[2]).not.toHaveClass('cursor-pointer');
  });

  it('does not make rows clickable without a handler', () => {
    render(<DataTable caption="Letters" columns={columns} rows={rows} getRowId={(row) => row.id} />);
    expect(screen.getAllByRole('row')[1]).not.toHaveClass('cursor-pointer');
  });
});
