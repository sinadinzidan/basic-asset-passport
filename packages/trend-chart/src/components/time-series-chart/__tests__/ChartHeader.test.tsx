import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ChartHeader } from '../ChartHeader';

it('offers the title as an Aura button that says it can be edited', () => {
  render(<ChartHeader title="Pump trend" onTitleChange={vi.fn()} />);

  const titleButton = screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' });
  expect(titleButton).toHaveAttribute('data-slot', 'button');
  expect(screen.getByRole('heading', { name: 'Pump trend' })).toBeInTheDocument();
});

it('reports the new title when Enter is pressed', async () => {
  const onTitleChange = vi.fn();
  render(<ChartHeader title="Pump trend" onTitleChange={onTitleChange} />);

  await userEvent.click(screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' }));
  const field = screen.getByRole('textbox', { name: 'Chart title' });
  await userEvent.clear(field);
  await userEvent.type(field, 'Seal pressure{Enter}');

  expect(onTitleChange).toHaveBeenCalledWith('Seal pressure');
  expect(screen.queryByRole('textbox', { name: 'Chart title' })).not.toBeInTheDocument();
});

it('keeps the title when Escape is pressed', async () => {
  const onTitleChange = vi.fn();
  render(<ChartHeader title="Pump trend" onTitleChange={onTitleChange} />);

  await userEvent.click(screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Chart title' }), 'x{Escape}');

  expect(onTitleChange).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' })).toBeInTheDocument();
});

it('leaves the dialog around it open when Escape cancels the edit', async () => {
  const onOpenChange = vi.fn();
  render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Chart</DialogTitle>
        <DialogDescription>The chart workspace.</DialogDescription>
        <ChartHeader title="Pump trend" onTitleChange={vi.fn()} />
      </DialogContent>
    </Dialog>,
  );

  await userEvent.click(screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Chart title' }), 'x{Escape}');

  expect(screen.getByRole('button', { name: 'Chart title: Pump trend. Edit' })).toBeInTheDocument();
  expect(onOpenChange).not.toHaveBeenCalled();
});

it('shows the status beside the title', () => {
  render(<ChartHeader title="Pump trend" onTitleChange={vi.fn()} status={<span>Live</span>} />);

  expect(screen.getByText('Live')).toBeInTheDocument();
});
