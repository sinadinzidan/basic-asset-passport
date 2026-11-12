import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DataQualityIssue, SeriesDataStatus } from '../../../../enums/timeSeriesChart';
import { setChartTimeZone } from '../../../../lib/timeZone';
import { createDefinition, createPoints, createSeriesView } from '../../../../mocks/chartData';
import type { ChartSeriesView, DataProfile } from '../../../../types/timeSeriesChart';
import { SeriesInfoPanel } from '../SeriesInfoPanel';

const FACT_LISTS = { IDENTIFICATION: 'Identification', DATA: 'Data' } as const;
type FactList = (typeof FACT_LISTS)[keyof typeof FACT_LISTS];

const START_MS = Date.UTC(2026, 9, 1, 7, 58);

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(SeriesInfoPanel.name, () => {
  it('identifies the series', () => {
    renderPanel(createSeriesView({ definition: createDefinition({ parentName: 'Pump 4' }) }));

    expect(factOf(FACT_LISTS.IDENTIFICATION, 'External ID')).toHaveTextContent(
      'Discharge pressure',
    );
    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Tag')).toHaveTextContent('PT-101');
    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Description')).toHaveTextContent(
      'Pump discharge pressure',
    );
    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Belongs to')).toHaveTextContent('Pump 4');
  });

  it('names what the series belongs to by its id when the name is not known', () => {
    renderPanel(createSeriesView({ definition: createDefinition({ parentId: 'asset-4' }) }));

    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Belongs to')).toHaveTextContent('asset-4');
  });

  it('says that what the data source does not supply is not available', () => {
    renderPanel(createSeriesView({ definition: createDefinition({ tag: '', unit: undefined }) }));

    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Tag')).toHaveTextContent('Not available');
    expect(factOf(FACT_LISTS.IDENTIFICATION, 'Belongs to')).toHaveTextContent('Not available');
    expect(factOf(FACT_LISTS.DATA, 'Unit')).toHaveTextContent('Not available');
    expect(factOf(FACT_LISTS.DATA, 'Data type')).toHaveTextContent('Not available');
    expect(factOf(FACT_LISTS.DATA, 'Sampling')).toHaveTextContent('Not available');
  });

  it('describes the data of the series', () => {
    const definition = createDefinition({ dataType: 'Numeric', sampling: 'Every minute' });

    renderPanel(createSeriesView({ definition }));

    expect(factOf(FACT_LISTS.DATA, 'Unit')).toHaveTextContent('bar');
    expect(factOf(FACT_LISTS.DATA, 'Data type')).toHaveTextContent('Numeric');
    expect(factOf(FACT_LISTS.DATA, 'Source')).toHaveTextContent('Demo');
    expect(factOf(FACT_LISTS.DATA, 'Sampling')).toHaveTextContent('Every minute');
  });

  it('says which unit the series is shown in only when it is not its own', () => {
    const { rerender } = renderPanel(createSeriesView());
    expect(within(screen.getByLabelText('Data')).queryByText('Shown in')).not.toBeInTheDocument();

    rerender(<SeriesInfoPanel series={createSeriesView({ unit: 'kPa' })} profile={undefined} />);

    expect(factOf(FACT_LISTS.DATA, 'Shown in')).toHaveTextContent('kPa');
  });

  it('says nothing of the status of the source while it is as usual', () => {
    renderPanel(createSeriesView());

    expect(
      within(screen.getByLabelText('Data')).queryByText('Source status'),
    ).not.toBeInTheDocument();
  });

  it('shows the status of the source when it is not the usual one', () => {
    renderPanel(createSeriesView({ status: SeriesDataStatus.STALE }));

    expect(factOf(FACT_LISTS.DATA, 'Source status')).toHaveTextContent('Stale');
  });

  it('gives the first and the last valid reading as the available range', () => {
    renderPanel(
      createSeriesView({ points: createPoints([null, 4, 6, 8, null], START_MS - 60_000) }),
    );

    expect(factOf(FACT_LISTS.DATA, 'Available data range')).toHaveTextContent(
      '01-Oct-2026 07:58 UTC to 01-Oct-2026 08:00 UTC',
    );
  });

  it('says that the range is not available without a valid reading', () => {
    renderPanel(createSeriesView({ points: createPoints([null, null]) }));

    expect(factOf(FACT_LISTS.DATA, 'Available data range')).toHaveTextContent('Not available');
  });

  it('says so when the series is not profiled yet', () => {
    renderPanel(createSeriesView());

    expect(screen.getByText('Not profiled yet for the visible range.')).toBeInTheDocument();
  });

  it('sums up a clean profile', () => {
    renderPanel(createSeriesView(), profile());

    expect(screen.getByText('3 valid readings in the visible range.')).toBeInTheDocument();
    expect(screen.getByText('No data quality issues found.')).toBeInTheDocument();
  });

  it('counts what is wrong with the readings of the range', () => {
    const counts = {
      validCount: 1,
      missingCount: 2,
      invalidCount: 1,
      badQualityCount: 4,
      duplicateTimestampCount: 3,
    };

    renderPanel(createSeriesView(), profile(counts));

    expect(
      screen.getByText(
        '1 valid reading, 2 missing, 1 invalid, 4 flagged as bad quality, 3 with a duplicate timestamp in the visible range.',
      ),
    ).toBeInTheDocument();
  });

  it('lists the warnings of the profile', () => {
    const warnings = [
      { issue: DataQualityIssue.MISSING_VALUE, message: 'Missing readings: 2' },
      {
        issue: DataQualityIssue.STALE,
        message: 'The latest valid reading is older than the freshness limit.',
      },
    ];

    renderPanel(createSeriesView(), profile({ missingCount: 2, warnings }));

    expect(screen.getByText('Missing readings: 2')).toBeInTheDocument();
    expect(
      screen.getByText('The latest valid reading is older than the freshness limit.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No data quality issues found.')).not.toBeInTheDocument();
  });
});

function profile(overrides: Partial<DataProfile> = {}): DataProfile {
  return {
    seriesId: 's1',
    validCount: 3,
    missingCount: 0,
    invalidCount: 0,
    badQualityCount: 0,
    duplicateTimestampCount: 0,
    gaps: [],
    isStale: false,
    statistics: { min: 4, max: 8, mean: 6, count: 3 },
    warnings: [],
    ...overrides,
  };
}

function renderPanel(series: ChartSeriesView, seriesProfile?: DataProfile) {
  return render(<SeriesInfoPanel series={series} profile={seriesProfile} />);
}

/** The value shown for a fact in one of the lists of the panel. */
function factOf(list: FactList, label: string): Element | null {
  return within(screen.getByLabelText(list)).getByText(label).nextElementSibling;
}
