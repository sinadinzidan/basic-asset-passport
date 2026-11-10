/** The contextual panels of the time-series chart; one is open at a time. */
export enum ChartPanel {
  ADD_DATA = 'ADD_DATA',
  LAYERS = 'LAYERS',
  DISPLAY = 'DISPLAY',
  AXES = 'AXES',
  SERIES_INFO = 'SERIES_INFO',
  CONNECTED_FILES = 'CONNECTED_FILES',
  ALERTING = 'ALERTING',
  MONITORING = 'MONITORING',
  THRESHOLDS = 'THRESHOLDS',
  DATA_PROFILING = 'DATA_PROFILING',
  ASSISTANT = 'ASSISTANT',
}

export enum ChartOverlay {
  THRESHOLDS = 'THRESHOLDS',
  EVENT_MARKERS = 'EVENT_MARKERS',
  DATA_GAPS = 'DATA_GAPS',
  MIN_MAX_BAND = 'MIN_MAX_BAND',
}

export enum AxisScaleMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export enum LineStyle {
  SOLID = 'SOLID',
  DASHED = 'DASHED',
  DOTTED = 'DOTTED',
}

/** Where a vertical-marker value came from; an interpolated value is never shown as an exact reading. */
export enum ReadingKind {
  EXACT = 'EXACT',
  NEAREST = 'NEAREST',
  INTERPOLATED = 'INTERPOLATED',
  MISSING = 'MISSING',
}

export enum ThresholdLevel {
  ALERT = 'ALERT',
  DANGER = 'DANGER',
}

export enum ThresholdSide {
  UPPER = 'UPPER',
  LOWER = 'LOWER',
}

/** Thresholds are configured or supplied by the data source; they are never inferred from the observed extremes. */
export enum ThresholdSource {
  DATA_SOURCE = 'DATA_SOURCE',
  CONFIGURED = 'CONFIGURED',
}

export enum DataQualityIssue {
  MISSING_VALUE = 'MISSING_VALUE',
  INVALID_VALUE = 'INVALID_VALUE',
  BAD_QUALITY = 'BAD_QUALITY',
  DUPLICATE_TIMESTAMP = 'DUPLICATE_TIMESTAMP',
  TIME_GAP = 'TIME_GAP',
  STALE = 'STALE',
}

export enum SeriesDataStatus {
  LOADING = 'LOADING',
  OK = 'OK',
  NO_DATA = 'NO_DATA',
  STALE = 'STALE',
  ERROR = 'ERROR',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CLEARED = 'CLEARED',
}

export enum AlertSeverity {
  ALERT = 'ALERT',
  DANGER = 'DANGER',
}

export enum UnitFamily {
  TEMPERATURE = 'TEMPERATURE',
  PRESSURE_GAUGE = 'PRESSURE_GAUGE',
  PRESSURE_ABSOLUTE = 'PRESSURE_ABSOLUTE',
  VELOCITY = 'VELOCITY',
  VOLUME_FLOW = 'VOLUME_FLOW',
  MASS_FLOW = 'MASS_FLOW',
  ELECTRIC_CURRENT = 'ELECTRIC_CURRENT',
  ROTATIONAL_SPEED = 'ROTATIONAL_SPEED',
  POWER = 'POWER',
}
