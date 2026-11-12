import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { AlertSeverity, AlertStatus } from '../../../../enums/timeSeriesChart';
import type { ChartAlert } from '../../../../types/timeSeriesChart';
import { AlertRow } from '../AlertRow';

const alert: ChartAlert = {
  id: 'alert-1',
  seriesId: 'pressure',
  severity: AlertSeverity.DANGER,
  status: AlertStatus.ACTIVE,
  at: Date.UTC(2026, 0, 5, 9, 30),
  message: 'Discharge pressure above the high limit',
};

it('offers the alert as an Aura button with its severity and message', () => {
  renderRow(alert);

  const row = screen.getByRole('button', {
    name: /Danger.*Discharge pressure above the high limit/,
  });
  expect(row).toHaveAttribute('data-slot', 'button');
});

it('says so when the alert is no longer active', () => {
  renderRow({ ...alert, status: AlertStatus.ACKNOWLEDGED });

  expect(screen.getByRole('button', { name: /Acknowledged/ })).toBeInTheDocument();
});

it('reports the alert when it is pressed', async () => {
  const onSelect = vi.fn();
  renderRow(alert, onSelect);

  await userEvent.click(screen.getByRole('button'));

  expect(onSelect).toHaveBeenCalledWith(alert);
});

function renderRow(shownAlert: ChartAlert, onSelect: (selected: ChartAlert) => void = vi.fn()) {
  return render(
    <ul>
      <AlertRow alert={shownAlert} onSelect={onSelect} />
    </ul>,
  );
}
