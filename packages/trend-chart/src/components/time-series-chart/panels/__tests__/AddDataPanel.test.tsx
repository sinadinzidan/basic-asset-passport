import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SERIES_SEARCH_PAGE_SIZE } from '../../../../constants/timeSeriesChart';
import { createChartAdapter, createDefinition } from '../../../../mocks/chartData';
import { createChartWrapper, createDeferred } from '../../../../mocks/ChartWrapper';
import type { ChartDataAdapter, SeriesSearchPage } from '../../../../types/timeSeriesChart';
import { AddDataPanel } from '../AddDataPanel';

const PRESSURE = createDefinition({
  id: 's1',
  name: 'Discharge pressure',
  tag: 'PT-101',
  unit: 'bar',
});
const FLOW = createDefinition({
  id: 's2',
  name: 'Flow',
  tag: 'FT-200',
  unit: 'm³/h',
  description: 'Pump flow',
});
const LEVEL = createDefinition({
  id: 's3',
  name: 'Level',
  tag: '',
  unit: undefined,
  description: 'level',
});
const CATALOGUE: SeriesSearchPage = { series: [PRESSURE, FLOW, LEVEL], total: 3 };

describe(AddDataPanel.name, () => {
  it('shows loading rows until the data source answers', () => {
    renderPanel({ searchSeries: () => createDeferred<SeriesSearchPage>().promise });

    expect(screen.getByRole('status', { name: 'Loading' }).children).toHaveLength(5);
  });

  it('lists the series that can be added, with their unit, tag and description', async () => {
    renderPanel();

    const flow = await findChoice('Flow');

    expect(flow).toHaveTextContent('m³/h');
    expect(flow).toHaveTextContent('FT-200');
    expect(flow).toHaveTextContent('Pump flow');
  });

  it('says that a unit or a tag is not available, and leaves out a description that only repeats the name', async () => {
    renderPanel();

    const level = await findChoice('Level');

    expect(within(level).getAllByText('Not available')).toHaveLength(2);
    expect(within(level).queryByText('level')).not.toBeInTheDocument();
  });

  it('asks the data source for everything, a page at a time, before anything is typed', async () => {
    const { searchSeries } = renderPanel();

    await findChoice('Flow');

    expect(searchSeries).toHaveBeenCalledWith('', { limit: SERIES_SEARCH_PAGE_SIZE });
  });

  it('marks a series already on the chart and does not let it be chosen', async () => {
    renderPanel({}, { existingIds: ['s1'] });

    const pressure = await findChoice('Discharge pressure');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Discharge pressure' }));

    expect(pressure).toHaveTextContent('Added');
    expect(screen.getByRole('checkbox', { name: 'Select Discharge pressure' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Add 0 series' })).toBeDisabled();
  });

  it('says how many are chosen and how much room is left', async () => {
    renderPanel({}, { existingIds: ['s1'], maxSeries: 12 });
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));

    expect(screen.getByText('1 selected, room for 10 more')).toBeInTheDocument();
  });

  it('cannot add while nothing is chosen', async () => {
    renderPanel();
    await findChoice('Flow');

    expect(screen.getByText('0 selected, room for 12 more')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 0 series' })).toBeDisabled();
  });

  it('adds the chosen series, in the order they were chosen', async () => {
    const { onAdd } = renderPanel();
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Level' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add 2 series' }));

    expect(onAdd).toHaveBeenCalledWith(['s3', 's2']);
  });

  it('lets a chosen series be dropped again', async () => {
    renderPanel();
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));

    expect(screen.getByRole('checkbox', { name: 'Select Flow' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Add 0 series' })).toBeDisabled();
  });

  it('says so, and chooses nothing more, once the chart would be full', async () => {
    renderPanel({}, { existingIds: ['s1'], maxSeries: 2 });
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Level' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The chart can hold 2 series and 1 is already on it. Deselect one to choose another.',
    );
    expect(screen.getByRole('checkbox', { name: 'Select Level' })).not.toBeChecked();
  });

  it('counts the series already on the chart in the plural', async () => {
    renderPanel({}, { existingIds: ['x', 'y'], maxSeries: 3 });
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Level' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The chart can hold 3 series and 2 are already on it.',
    );
  });

  it('says that one must be removed first when the chart is already full', async () => {
    renderPanel({}, { existingIds: ['x', 'y'], maxSeries: 2 });
    await findChoice('Flow');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The chart already shows 2 series, the most it can hold. Remove one to add another.',
    );
  });

  it('takes the message away when a chosen series is dropped', async () => {
    renderPanel({}, { existingIds: ['s1'], maxSeries: 2 });
    await findChoice('Flow');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Level' }));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Flow' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('searches for what is typed, once the typing pauses', async () => {
    const { searchSeries } = renderPanel();
    await findChoice('Flow');

    await userEvent.type(screen.getByLabelText('Search time series'), ' pump ');

    await waitFor(() =>
      expect(searchSeries).toHaveBeenLastCalledWith('pump', { limit: SERIES_SEARCH_PAGE_SIZE }),
    );
    expect(searchSeries).toHaveBeenCalledTimes(2);
  });

  it('says so when no series matches', async () => {
    renderPanel({ searchSeries: async () => ({ series: [], total: 0 }) });

    expect(await screen.findByText('No series match')).toBeInTheDocument();
    expect(
      screen.getByText('Try a shorter name or a tag, or clear the search.'),
    ).toBeInTheDocument();
  });

  it('shows a failed search as a failure and tries again when asked', async () => {
    const searchSeries = vi
      .fn<ChartDataAdapter['searchSeries']>()
      .mockRejectedValueOnce(new Error('The source is down'))
      .mockResolvedValue(CATALOGUE);
    renderPanel({ searchSeries });
    expect(await screen.findByRole('alert')).toHaveTextContent('The source is down');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await findChoice('Flow')).toBeInTheDocument();
  });

  it('says how many of the matches are shown', async () => {
    renderPanel({ searchSeries: async () => ({ series: [PRESSURE, FLOW], total: 120 }) });

    expect(await screen.findByText('Showing 2 of 120')).toBeInTheDocument();
  });

  it('asks for a longer page when more are wanted', async () => {
    const { searchSeries } = renderPanel({
      searchSeries: async () => ({ series: [PRESSURE, FLOW], total: 120 }),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Show more' }));

    await waitFor(() =>
      expect(searchSeries).toHaveBeenLastCalledWith('', { limit: 2 * SERIES_SEARCH_PAGE_SIZE }),
    );
  });

  it('offers no more when every match is shown', async () => {
    renderPanel();

    await findChoice('Flow');

    expect(screen.getByText('Showing 3 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });
});

function renderPanel(
  adapterOverrides: Partial<Pick<ChartDataAdapter, 'searchSeries'>> = {},
  properties: Partial<Parameters<typeof AddDataPanel>[0]> = {},
) {
  const searchSeries = vi.fn<ChartDataAdapter['searchSeries']>(
    adapterOverrides.searchSeries ?? (async () => CATALOGUE),
  );
  const onAdd = vi.fn();
  render(<AddDataPanel existingIds={[]} maxSeries={12} onAdd={onAdd} {...properties} />, {
    wrapper: createChartWrapper(createChartAdapter({ searchSeries })),
  });
  return { searchSeries, onAdd };
}

/** The row of a series in the list, once the list has loaded. */
async function findChoice(name: string): Promise<HTMLElement> {
  const list = await screen.findByRole('list', { name: 'Available time series' });
  const row = within(list)
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('checkbox', { name: `Select ${name}` }) !== null);
  if (!row) throw new Error(`No series named ${name} in the list`);
  return row;
}
