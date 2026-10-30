import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AssetPassportRecord } from '../../../types/passport';
import { EquipmentSwitcher } from '../EquipmentSwitcher';

const passports: AssetPassportRecord[] = [
  { asset: { id: 'a', name: 'Drive motor', externalId: 'M-1' }, location: '', specifications: [], documents: [] },
  { asset: { id: 'b', name: 'Feed pump', externalId: 'P-1' }, location: '', specifications: [], documents: [] },
];

describe('EquipmentSwitcher', () => {
  it('lists every item with its identifier and marks the selected one', () => {
    render(<EquipmentSwitcher passports={passports} selectedId="b" onSelect={vi.fn()} />);
    expect(screen.getByText('2 items linked')).toBeInTheDocument();
    expect(screen.getByText('M-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Feed pump/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /Drive motor/ })).not.toHaveAttribute('aria-current');
  });

  it('says more may exist when the list reaches the query limit', () => {
    const many = Array.from({ length: 25 }, (_, index): AssetPassportRecord => ({
      asset: { id: `m-${index}`, name: `Motor ${index}`, externalId: `M-${index}` }, location: '', specifications: [], documents: [],
    }));
    render(<EquipmentSwitcher passports={many} selectedId="m-0" onSelect={vi.fn()} />);
    expect(screen.getByText('First 25 items linked; more may exist')).toBeInTheDocument();
  });

  it('reports the chosen item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<EquipmentSwitcher passports={passports} selectedId="a" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Feed pump/ }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('b');
  });
});
