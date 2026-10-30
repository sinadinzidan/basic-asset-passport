export const FILE_VIEWER_MIN_ZOOM = 0.25;
export const FILE_VIEWER_MAX_ZOOM = 5;
export const FILE_VIEWER_ZOOM_STEP = 0.25;
export const WHEEL_ZOOM_OUT_FACTOR = 0.9;
export const WHEEL_ZOOM_IN_FACTOR = 1.1;

export const ROTATION_QUARTER_TURN_DEGREES = 90;
export const ROTATION_HALF_TURN_DEGREES = 180;
export const ROTATION_THREE_QUARTER_TURN_DEGREES = 270;

export const ANNOTATION_STROKE_WIDTH = 1.5;
export const ANNOTATION_HOVER_STROKE_WIDTH = 2;

export const DEFAULT_IMAGE_ALT = 'Image preview';

/** Longest text file shown in full; a larger file is cut here so the dialog stays responsive. */
export const TEXT_PREVIEW_MAX_CHARS = 500_000;

/** Size assumed for an image that reports none (an SVG without width and height), so it still renders. */
export const IMAGE_FALLBACK_SIZE = { width: 800, height: 600 };
