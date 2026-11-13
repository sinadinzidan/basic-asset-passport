import { Tone } from '../enums/display';
import { ChartMode, ChartRange } from '../enums/monitoring';
import {
  AlertSeverity,
  AlertStatus,
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

import {
  MILLISECONDS_PER_MINUTE,
  CHART_ALL_HISTORY_DAYS,
  CHART_MAX_SIGNALS,
  SIGNAL_SERIES_COLORS,
} from './monitoring';

const STALE_AFTER_MINUTES = 30;

export const CHART_MAX_SERIES = CHART_MAX_SIGNALS;
export const CHART_MAX_CONFIGURED_THRESHOLDS = 12;
export const CHART_TITLE_MAX_LENGTH = 80;
export const CHART_DEFAULT_TITLE = 'Untitled chart';
export const CHART_DEFAULT_RANGE_PRESET = ChartRange.ONE_WEEK;
export const CHART_DEFAULT_MODE = ChartMode.OVERLAID;
export const CHART_DEFAULT_OVERLAYS: readonly ChartOverlay[] = [
  ChartOverlay.THRESHOLDS,
  ChartOverlay.EVENT_MARKERS,
  ChartOverlay.DATA_GAPS,
];

/** A reading is stale when the latest one is older than this. */
export const CHART_STALE_AFTER_MS = STALE_AFTER_MINUTES * MILLISECONDS_PER_MINUTE;
/** A gap is an interval between valid readings longer than this many typical steps. */
export const CHART_GAP_STEP_FACTOR = 5;
/** The marker reads the nearest reading when it is within this many typical steps; otherwise the value is missing. */
export const CHART_NEAREST_STEP_FACTOR = 1.5;
/** Interpolation bridges at most this many typical steps between two readings. */
export const CHART_INTERPOLATION_STEP_FACTOR = 3;
export const CHART_MIN_PROFILE_POINTS = 3;

export const CHART_LINE_WIDTH_THIN = 1.5;
const LINE_WIDTH_MEDIUM = 2.25;
const LINE_WIDTH_THICK = 3.5;
export const CHART_LINE_WIDTHS: readonly number[] = [
  CHART_LINE_WIDTH_THIN,
  LINE_WIDTH_MEDIUM,
  LINE_WIDTH_THICK,
];
export const CHART_COLOR_PALETTE: readonly string[] = SIGNAL_SERIES_COLORS;
export const CHART_WHEEL_ZOOM_FACTOR = 1.25;
export const CHART_PAN_KEYBOARD_RATIO = 0.1;
export const CHART_SIDEBAR_WIDTH_PX = 360;
export const CHART_PLOT_MIN_HEIGHT_PX = 320;
export const CHART_WORKSPACE_PLOT_HEIGHT_PX = 440;
export const CHART_MAX_SOURCE_POINTS = 4000;

export const LIVE_INTERVAL_MS = 1000;
export const LIVE_MAX_POINTS = 6000;
export const LIVE_STEP_MS = MILLISECONDS_PER_MINUTE;

export const ASSISTANT_PANEL_LABEL = 'Assistant';

export const CHART_PANEL_LABELS: Record<ChartPanel, string> = {
  [ChartPanel.ADD_DATA]: 'Add data',
  [ChartPanel.LAYERS]: 'Layers',
  [ChartPanel.DISPLAY]: 'Display',
  [ChartPanel.AXES]: 'Axes',
  [ChartPanel.SERIES_INFO]: 'Series information',
  [ChartPanel.CONNECTED_FILES]: 'Connected files',
  [ChartPanel.ALERTING]: 'Alerting',
  [ChartPanel.MONITORING]: 'Monitoring',
  [ChartPanel.THRESHOLDS]: 'Thresholds',
  [ChartPanel.DATA_PROFILING]: 'Data profiling',
  [ChartPanel.ASSISTANT]: ASSISTANT_PANEL_LABEL,
};

export const CHART_OVERLAY_LABELS: Record<ChartOverlay, string> = {
  [ChartOverlay.THRESHOLDS]: 'Thresholds',
  [ChartOverlay.EVENT_MARKERS]: 'Event markers',
  [ChartOverlay.DATA_GAPS]: 'Data gaps',
  [ChartOverlay.MIN_MAX_BAND]: 'Min-max band',
};

export const CHART_OVERLAY_DESCRIPTIONS: Record<ChartOverlay, string> = {
  [ChartOverlay.THRESHOLDS]: 'Alert and danger limits as lines, with readings outside them marked.',
  [ChartOverlay.EVENT_MARKERS]:
    'Events the host marks on the time axis, such as alarms or inspections.',
  [ChartOverlay.DATA_GAPS]: 'Hatching where a series has no valid reading.',
  [ChartOverlay.MIN_MAX_BAND]: 'The spread between the lowest and highest reading in each bucket.',
};

export const LINE_STYLE_LABELS: Record<LineStyle, string> = {
  [LineStyle.SOLID]: 'Solid',
  [LineStyle.DASHED]: 'Dashed',
  [LineStyle.DOTTED]: 'Dotted',
};

export const LINE_STYLE_DASH_ARRAYS: Record<LineStyle, string | undefined> = {
  [LineStyle.SOLID]: undefined,
  [LineStyle.DASHED]: '7 4',
  [LineStyle.DOTTED]: '1.5 4',
};

export const READING_KIND_LABELS: Record<ReadingKind, string> = {
  [ReadingKind.EXACT]: 'Reading',
  [ReadingKind.NEAREST]: 'Nearest reading',
  [ReadingKind.INTERPOLATED]: 'Interpolated',
  [ReadingKind.MISSING]: 'No reading',
};

export const THRESHOLD_LEVEL_LABELS: Record<ThresholdLevel, string> = {
  [ThresholdLevel.ALERT]: 'Alert',
  [ThresholdLevel.DANGER]: 'Danger',
};

export const THRESHOLD_SOURCE_LABELS: Record<ThresholdSource, string> = {
  [ThresholdSource.DATA_SOURCE]: 'From the data source',
  [ThresholdSource.CONFIGURED]: 'Added on this chart',
};

export const THRESHOLD_SIDE_LABELS: Record<ThresholdSide, string> = {
  [ThresholdSide.UPPER]: 'High limit',
  [ThresholdSide.LOWER]: 'Low limit',
};

export const DATA_QUALITY_ISSUE_LABELS: Record<DataQualityIssue, string> = {
  [DataQualityIssue.MISSING_VALUE]: 'Missing readings',
  [DataQualityIssue.INVALID_VALUE]: 'Invalid readings',
  [DataQualityIssue.BAD_QUALITY]: 'Flagged as bad quality',
  [DataQualityIssue.DUPLICATE_TIMESTAMP]: 'Duplicate timestamps',
  [DataQualityIssue.TIME_GAP]: 'Gaps in time',
  [DataQualityIssue.STALE]: 'Stale data',
};

export const SERIES_STATUS_LABELS: Record<SeriesDataStatus, string> = {
  [SeriesDataStatus.LOADING]: 'Loading',
  [SeriesDataStatus.OK]: 'Data',
  [SeriesDataStatus.NO_DATA]: 'No data',
  [SeriesDataStatus.STALE]: 'Stale',
  [SeriesDataStatus.ERROR]: 'Failed',
};

export const SERIES_STATUS_TONES: Record<SeriesDataStatus, Tone> = {
  [SeriesDataStatus.LOADING]: Tone.NEUTRAL,
  [SeriesDataStatus.OK]: Tone.SUCCESS,
  [SeriesDataStatus.NO_DATA]: Tone.WARNING,
  [SeriesDataStatus.STALE]: Tone.WARNING,
  [SeriesDataStatus.ERROR]: Tone.DANGER,
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.ALERT]: 'Alert',
  [AlertSeverity.DANGER]: 'Danger',
};

export const ALERT_SEVERITY_TONES: Record<AlertSeverity, Tone> = {
  [AlertSeverity.ALERT]: Tone.WARNING,
  [AlertSeverity.DANGER]: Tone.DANGER,
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  [AlertStatus.ACTIVE]: 'Active',
  [AlertStatus.ACKNOWLEDGED]: 'Acknowledged',
  [AlertStatus.CLEARED]: 'Cleared',
};

export const ALERT_STATUS_TONES: Record<AlertStatus, Tone> = {
  [AlertStatus.ACTIVE]: Tone.DANGER,
  [AlertStatus.ACKNOWLEDGED]: Tone.INFO,
  [AlertStatus.CLEARED]: Tone.SUCCESS,
};

export const THRESHOLD_LEVEL_TONES: Record<ThresholdLevel, Tone> = {
  [ThresholdLevel.ALERT]: Tone.WARNING,
  [ThresholdLevel.DANGER]: Tone.DANGER,
};

export const SERIES_SEARCH_PAGE_SIZE = 50;

export const CHART_SIDEBAR_TRANSITION_MS = 220;

export interface ChartRangePreset {
  id: string;
  label: string;
  minutes: number;
  /** The relative range this preset stands for, so it keeps following now; the others are plain windows. */
  range?: ChartRange;
}

const MINUTES_PER_DAY = 1440;

export const CHART_RANGE_PRESETS: readonly ChartRangePreset[] = [
  {
    id: 'last-15-minutes',
    label: 'Last 15 minutes',
    minutes: 15,
    range: ChartRange.FIFTEEN_MINUTES,
  },
  { id: 'last-hour', label: 'Last hour', minutes: 60, range: ChartRange.ONE_HOUR },
  { id: 'last-6-hours', label: 'Last 6 hours', minutes: 360, range: ChartRange.SIX_HOURS },
  { id: 'last-12-hours', label: 'Last 12 hours', minutes: 720, range: ChartRange.TWELVE_HOURS },
  {
    id: 'last-24-hours',
    label: 'Last 24 hours',
    minutes: MINUTES_PER_DAY,
    range: ChartRange.ONE_DAY,
  },
  { id: 'last-2-days', label: 'Last 2 days', minutes: 2880 },
  {
    id: 'last-7-days',
    label: 'Last 7 days',
    minutes: 10_080,
    range: ChartRange.ONE_WEEK,
  },
  { id: 'last-2-weeks', label: 'Last 2 weeks', minutes: 20_160 },
  {
    id: 'last-month',
    label: 'Last month',
    minutes: 43_200,
    range: ChartRange.ONE_MONTH,
  },
  { id: 'last-3-months', label: 'Last 3 months', minutes: 129_600 },
  { id: 'last-6-months', label: 'Last 6 months', minutes: 259_200 },
  {
    id: 'last-year',
    label: 'Last year',
    minutes: 525_600,
    range: ChartRange.ONE_YEAR,
  },
  {
    id: 'all-history',
    label: 'All history',
    minutes: CHART_ALL_HISTORY_DAYS * MINUTES_PER_DAY,
    range: ChartRange.ALL_HISTORY,
  },
];
