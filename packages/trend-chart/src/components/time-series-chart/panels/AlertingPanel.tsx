import { Button } from '@cognite/aura/components/button';
import { IconFilterOff } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { ALERT_SEVERITY_LABELS, ALERT_STATUS_LABELS } from '../../../constants/timeSeriesChart';
import { FilterLayout } from '../../../enums/display';
import { StateSize } from '../../../enums/stateSize';
import { StateVariant } from '../../../enums/stateVariant';
import { AlertSeverity, AlertStatus } from '../../../enums/timeSeriesChart';
import type { ChartAlert, ChartSeriesView } from '../../../types/timeSeriesChart';
import { FilterSelect } from '../../general/FilterSelect';
import { ErrorState, LoadingRows } from '../../general/QueryState';
import { StateMessage } from '../../general/StateMessage';

import { AlertRow } from './AlertRow';

interface AlertingPanelProperties {
  series: readonly ChartSeriesView[];
  alerts: readonly ChartAlert[];
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  onSelectAlert: (alert: ChartAlert) => void;
}

const SEVERITY_ORDER: readonly AlertSeverity[] = [AlertSeverity.DANGER, AlertSeverity.ALERT];
const STATUS_ORDER: readonly AlertStatus[] = [
  AlertStatus.ACTIVE,
  AlertStatus.ACKNOWLEDGED,
  AlertStatus.CLEARED,
];

function matchesSeverity(alert: ChartAlert, choice: AlertSeverity | undefined): boolean {
  return choice === undefined || alert.severity === choice;
}

function matchesStatus(alert: ChartAlert, choice: AlertStatus | undefined): boolean {
  return choice === undefined || alert.status === choice;
}

/**
 * The alerts of the series on the chart, newest first. They are read-only: nothing here creates or acknowledges an alert.
 * Choosing one hands it to the chart, which moves the marker to its time.
 */
export function AlertingPanel({
  series,
  alerts,
  isLoading,
  error,
  onRetry,
  onSelectAlert,
}: AlertingPanelProperties) {
  const [severityChoice, setSeverityChoice] = useState<AlertSeverity | undefined>(undefined);
  const [statusChoice, setStatusChoice] = useState<AlertStatus | undefined>(undefined);

  const seriesById = useMemo(
    () => new Map(series.map((entry) => [entry.configuration.seriesId, entry])),
    [series],
  );
  const seriesAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => seriesById.has(alert.seriesId))
        .sort((first, second) => second.at - first.at),
    [alerts, seriesById],
  );
  const visibleAlerts = useMemo(
    () =>
      seriesAlerts.filter(
        (alert) => matchesSeverity(alert, severityChoice) && matchesStatus(alert, statusChoice),
      ),
    [seriesAlerts, severityChoice, statusChoice],
  );

  // Each choice counts what the list would show if it were picked, given the other filter, so the numbers always add up.
  const inSelectedStatus = useMemo(
    () => seriesAlerts.filter((alert) => matchesStatus(alert, statusChoice)),
    [seriesAlerts, statusChoice],
  );
  const inSelectedSeverity = useMemo(
    () => seriesAlerts.filter((alert) => matchesSeverity(alert, severityChoice)),
    [seriesAlerts, severityChoice],
  );
  const severityOptions = SEVERITY_ORDER.map((severity) => ({
    value: severity,
    label: `${ALERT_SEVERITY_LABELS[severity]} (${inSelectedStatus.filter((alert) => alert.severity === severity).length})`,
  }));
  const statusOptions = STATUS_ORDER.map((status) => ({
    value: status,
    label: `${ALERT_STATUS_LABELS[status]} (${inSelectedSeverity.filter((alert) => alert.status === status).length})`,
  }));
  const isNamingSeries = series.length > 1;

  const handleSeverityChange = (value: string | undefined): void => {
    setSeverityChoice(SEVERITY_ORDER.find((severity) => severity === value));
  };
  const handleStatusChange = (value: string | undefined): void => {
    setStatusChoice(STATUS_ORDER.find((status) => status === value));
  };
  const handleClearFilters = (): void => {
    setSeverityChoice(undefined);
    setStatusChoice(undefined);
  };

  return (
    <AlertingContent
      hasSeries={series.length > 0}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hasAlerts={seriesAlerts.length > 0}
      filters={
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 [&_[role=combobox]]:w-full [&_[role=combobox]]:min-w-0">
          <FilterSelect
            layout={FilterLayout.STACKED}
            label="Severity"
            value={severityChoice}
            options={severityOptions}
            onChange={handleSeverityChange}
            allLabel={`All (${inSelectedStatus.length})`}
          />
          <FilterSelect
            layout={FilterLayout.STACKED}
            label="Status"
            value={statusChoice}
            options={statusOptions}
            onChange={handleStatusChange}
            allLabel={`All (${inSelectedSeverity.length})`}
          />
        </div>
      }
    >
      {visibleAlerts.length === 0 ? (
        <StateMessage
          size={StateSize.INLINE}
          variant={StateVariant.NO_RESULTS}
          title="No alerts match these filters"
          action={
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <IconFilterOff size={16} aria-hidden />
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul
          aria-label="Alerts"
          className="-mx-4 flex flex-col divide-y divide-border border-y border-border"
        >
          {visibleAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              labelledSeries={isNamingSeries ? seriesById.get(alert.seriesId) : undefined}
              onSelect={onSelectAlert}
            />
          ))}
        </ul>
      )}
    </AlertingContent>
  );
}

interface AlertingContentProperties {
  hasSeries: boolean;
  isLoading: boolean;
  error: Error | undefined;
  onRetry: () => void;
  hasAlerts: boolean;
  filters: ReactNode;
  children: ReactNode;
}

function AlertingContent({
  hasSeries,
  isLoading,
  error,
  onRetry,
  hasAlerts,
  filters,
  children,
}: AlertingContentProperties) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isLoading) return <LoadingRows rows={3} />;
  if (!hasSeries)
    return (
      <StateMessage
        size={StateSize.INLINE}
        title="No series selected"
        description="Add a series to see its alerts."
      />
    );
  if (!hasAlerts)
    return (
      <StateMessage size={StateSize.INLINE} title="No alerts for these series in this range" />
    );
  return (
    <>
      {filters}
      {children}
    </>
  );
}
