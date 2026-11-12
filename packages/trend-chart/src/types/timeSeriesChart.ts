import type { EventShape } from '../enums/eventShape';
import type { EventTone } from '../enums/eventTone';
import type { ChartMode, ChartRange } from '../enums/monitoring';
import type {
  AlertSeverity,
  AlertStatus,
  AxisScaleMode,
  ChartOverlay,
  ChartPanel,
  DataQualityIssue,
  LineStyle,
  ReadingKind,
  SeriesDataStatus,
  ThresholdLevel,
  ThresholdSide,
  ThresholdSource,
} from '../enums/timeSeriesChart';

export interface TimeSeriesDefinition {
  id: string;
  name: string;
  tag: string;
  description: string;
  /** Missing metadata stays undefined and is shown as unavailable, never invented. */
  unit?: string;
  /** What the series belongs to, such as a piece of equipment. */
  parentId?: string;
  parentName?: string;
  dataType?: string;
  /** Where the readings come from; a simulated source must say so. */
  sourceName: string;
  isSimulated: boolean;
  sampling?: string;
}

/** One reading. Timestamps are milliseconds since the epoch throughout the chart. */
export interface TimeSeriesPoint {
  timestamp: number;
  /** Null where there is no reading; a missing reading is never drawn as zero. */
  value: number | null;
  isBadQuality?: boolean;
}

export interface TimeSeriesData {
  seriesId: string;
  points: TimeSeriesPoint[];
}

export interface ChartTimeRange {
  start: number;
  end: number;
}

export interface SeriesStatistics {
  min: number | null;
  max: number | null;
  mean: number | null;
  count: number;
}

export interface SeriesStyle {
  /** A colour token, for example `var(--chart-nordic-color-1)`; hex values are not used. */
  color: string;
  lineWidth: number;
  lineStyle: LineStyle;
}

export interface SeriesConfiguration {
  seriesId: string;
  isVisible: boolean;
  style: SeriesStyle;
  /** The unit the series is shown in; absent means its own unit. Only a known conversion may be chosen. */
  displayUnit?: string;
}

export interface AxisSetting {
  seriesId: string;
  mode: AxisScaleMode;
  min?: number;
  max?: number;
}

export interface ChartThreshold {
  id: string;
  seriesId: string;
  level: ThresholdLevel;
  side: ThresholdSide;
  value: number;
  unit: string;
  source: ThresholdSource;
  label?: string;
  /** A reference line (a target) is drawn and labelled but readings beyond it are not marked as breaches. */
  isReference?: boolean;
}

export interface ChartConfiguration {
  title: string;
  range: ChartRange;
  window?: ChartTimeRange;
  mode: ChartMode;
  series: SeriesConfiguration[];
  axes: AxisSetting[];
  shouldShowGridlines: boolean;
  shouldShowMinMax: boolean;
  isMarkerMode: boolean;
  markerAt?: number;
  isLive: boolean;
  overlays: ChartOverlay[];
  panel?: ChartPanel;
}

export interface MarkerReading {
  seriesId: string;
  kind: ReadingKind;
  value: number | null;
  /** The timestamp of the reading the value comes from; differs from the marker for NEAREST and INTERPOLATED. */
  readingAt?: number;
}

export interface GapInterval {
  from: number;
  to: number;
}

export interface DataProfile {
  seriesId: string;
  validCount: number;
  missingCount: number;
  invalidCount: number;
  badQualityCount: number;
  duplicateTimestampCount: number;
  gaps: GapInterval[];
  latestAt?: number;
  isStale: boolean;
  statistics: SeriesStatistics;
  warnings: Array<{ issue: DataQualityIssue; message: string }>;
}

export interface ThresholdBreach {
  threshold: ChartThreshold;
  from: number;
  to: number;
  peak: number;
}

export interface ChartAlert {
  id: string;
  seriesId: string;
  severity: AlertSeverity;
  status: AlertStatus;
  at: number;
  message: string;
}

export interface MonitoringSnapshot {
  seriesId: string;
  latestValue: number | null;
  latestAt?: number;
  /** Milliseconds between the latest reading and now; undefined when there is none. */
  ageMs?: number;
  status: SeriesDataStatus;
  isSimulated: boolean;
}

export interface ConnectedFile {
  id: string;
  name: string;
  kind: string;
  mimeType?: string;
  updatedAt?: number;
  openUrl?: string;
  unavailableReason?: string;
  sizeBytes?: number;
}

/** A point in time marked on the plot. The host decides how a kind looks: its label, shape and tone. */
export interface ChartEvent {
  id: string;
  kind: string;
  /** Names the kind in the marker's title, such as "Alarm"; the kind itself when not set. */
  kindLabel?: string;
  shape?: EventShape;
  tone?: EventTone;
  at: number;
  label: string;
}

/**
 * Everything the plot, the table and the panels need to know about one configured series, resolved by the chart from its
 * definition, its configuration and its loaded readings. A panel never loads data itself.
 */
export interface ChartSeriesView {
  definition: TimeSeriesDefinition;
  configuration: SeriesConfiguration;
  index: number;
  status: SeriesDataStatus;
  errorMessage?: string;
  /** The unit the readings, the axis and the thresholds are shown in: the chosen display unit, or the series' own. Empty when unknown. */
  unit: string;
  /** All loaded readings in `unit`, in timestamp order; not cut to the visible window. */
  points: TimeSeriesPoint[];
  statistics: SeriesStatistics;
  /** In `unit`. Only what the data source supplies or the user configured. */
  thresholds: ChartThreshold[];
}

export interface SeriesSearchPage {
  series: TimeSeriesDefinition[];
  total: number;
}

export interface ChartDataAdapter {
  /** The series that can be added; an empty query lists everything the user may add. Only the first `limit` matches are returned, with the total, so a large catalogue is never sent whole. */
  searchSeries: (query: string, page: { limit: number }) => Promise<SeriesSearchPage>;
  getSeriesData: (seriesIds: string[], range: ChartTimeRange) => Promise<TimeSeriesData[]>;
  getSeriesDetails: (seriesId: string) => Promise<TimeSeriesDefinition | undefined>;
  getThresholds: (seriesIds: string[]) => Promise<ChartThreshold[]>;
  getAlerts: (seriesIds: string[], range: ChartTimeRange) => Promise<ChartAlert[]>;
  getConnectedFiles: (seriesId: string) => Promise<ConnectedFile[]>;
  getEvents: (range: ChartTimeRange) => Promise<ChartEvent[]>;
}
