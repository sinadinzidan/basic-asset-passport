import {
  ALERT_SEVERITY_LABELS,
  ALERT_SEVERITY_TONES,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_TONES,
} from '../../../constants/timeSeriesChart';
import { PillSize } from '../../../enums/display';
import { AlertStatus } from '../../../enums/timeSeriesChart';
import type { ChartAlert, ChartSeriesView } from '../../../types/timeSeriesChart';
import { PlainButton } from '../../general/PlainButton';
import { StatusPill } from '../../general/StatusPill';

import { formatChartInstant, formatChartInstantShort } from './panelFormat';
import { SeriesLabel } from './SeriesLabel';

interface AlertRowProperties {
  alert: ChartAlert;
  labelledSeries?: ChartSeriesView;
  onSelect: (alert: ChartAlert) => void;
}

export function AlertRow({ alert, labelledSeries, onSelect }: AlertRowProperties) {
  return (
    <li>
      <PlainButton
        onClick={() => onSelect(alert)}
        className="flex w-full min-w-0 flex-col items-stretch gap-1 rounded-none px-4 py-2.5 hover:bg-muted-background/50 focus-visible:-outline-offset-2"
      >
        <span className="flex items-center gap-1.5">
          <StatusPill
            label={ALERT_SEVERITY_LABELS[alert.severity]}
            tone={ALERT_SEVERITY_TONES[alert.severity]}
            size={PillSize.SMALL}
          />
          {alert.status === AlertStatus.ACTIVE ? null : (
            <StatusPill
              label={ALERT_STATUS_LABELS[alert.status]}
              tone={ALERT_STATUS_TONES[alert.status]}
              size={PillSize.SMALL}
            />
          )}
          <time
            dateTime={new Date(alert.at).toISOString()}
            title={formatChartInstant(alert.at)}
            className="tabular-nums ml-auto shrink-0 text-xs text-muted-foreground"
          >
            {formatChartInstantShort(alert.at)}
          </time>
        </span>
        <span className="text-sm text-foreground">{alert.message}</span>
        {labelledSeries ? <SeriesLabel series={labelledSeries} isQuiet /> : null}
      </PlainButton>
    </li>
  );
}
