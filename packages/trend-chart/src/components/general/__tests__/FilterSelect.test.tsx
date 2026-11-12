import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterLayout } from '../../../enums/display';
import { FilterSelect } from '../FilterSelect';

const KINDS = [
  { value: 'pressure', label: 'Pressure' },
  { value: 'flow', label: 'Flow' },
];

describe(FilterSelect.name, () => {
  it('is named by its label', () => {
    renderFilter();

    expect(screen.getByRole('combobox', { name: 'Kind' })).toBeInTheDocument();
  });

  it('shows "All" while nothing is chosen', () => {
    renderFilter({ value: undefined });

    expect(screen.getByRole('combobox')).toHaveTextContent('All');
  });

  it('names the choice of everything as it is told', () => {
    renderFilter({ value: undefined, allLabel: 'Any kind' });

    expect(screen.getByRole('combobox')).toHaveTextContent('Any kind');
  });

  it('shows the label of the chosen option', () => {
    renderFilter({ value: 'flow' });

    expect(screen.getByRole('combobox')).toHaveTextContent('Flow');
  });

  it('shows "All" for a value that is not among the options', () => {
    renderFilter({ value: 'temperature' });

    expect(screen.getByRole('combobox')).toHaveTextContent('All');
  });

  it('lists everything first and then each option', async () => {
    renderFilter();

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All',
      'Pressure',
      'Flow',
    ]);
  });

  it('leaves out the choice of everything for a filter that always has a value', async () => {
    renderFilter({ value: 'flow', hasAllOption: false });

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Pressure',
      'Flow',
    ]);
  });

  it('reports the value of the option that is chosen', async () => {
    const onChange = vi.fn();
    renderFilter({ onChange });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Flow' }));

    expect(onChange).toHaveBeenCalledWith('flow');
  });

  it('reports no value when everything is chosen', async () => {
    const onChange = vi.fn();
    renderFilter({ value: 'flow', onChange });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'All' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('keeps a hidden label for assistive technology', () => {
    renderFilter({ isLabelHidden: true });

    expect(screen.getByText('Kind')).toHaveClass('sr-only');
    expect(screen.getByRole('combobox', { name: 'Kind' })).toBeInTheDocument();
  });

  it('puts the label above the control when stacked', () => {
    renderFilter({ layout: FilterLayout.STACKED });

    expect(screen.getByText('Kind').parentElement).toHaveClass('flex-col');
  });

  it('hides the label of a stacked filter as well', () => {
    renderFilter({ layout: FilterLayout.STACKED, isLabelHidden: true });

    expect(screen.getByText('Kind')).toHaveClass('sr-only');
  });
});

function renderFilter(overrides: Partial<Parameters<typeof FilterSelect>[0]> = {}) {
  return render(
    <FilterSelect
      label="Kind"
      value={undefined}
      options={KINDS}
      onChange={vi.fn()}
      {...overrides}
    />,
  );
}
