import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { PlainButton } from '../PlainButton';

it('is an Aura button marked as one that keeps its own look', () => {
  render(<PlainButton>Pump trend</PlainButton>);

  const button = screen.getByRole('button', { name: 'Pump trend' });
  expect(button).toHaveAttribute('data-slot', 'button');
  expect(button).toHaveClass('chart-plain-button');
});

it('takes the classes that lay out its content', () => {
  render(<PlainButton className="w-full flex-col">Pump trend</PlainButton>);

  expect(screen.getByRole('button', { name: 'Pump trend' })).toHaveClass('w-full', 'flex-col');
});

it('reports a press', async () => {
  const onClick = vi.fn();
  render(<PlainButton onClick={onClick}>Pump trend</PlainButton>);

  await userEvent.click(screen.getByRole('button', { name: 'Pump trend' }));

  expect(onClick).toHaveBeenCalledOnce();
});
