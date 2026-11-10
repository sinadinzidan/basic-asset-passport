import { MILLISECONDS_PER_DAY } from '../../../constants/formats';
import { STATUS_COLORS } from '../../general/charts/chartColors';

/** Used until the container has been measured, and in environments without layout. */
export const FALLBACK_WIDTH_PX = 880;
export const HOVER_CARD_WIDTH_PX = 232;
export const EVENT_GLYPH_SIZE_PX = 18;
export const EVENT_BOTTOM_INSET_PX = 2;
/** A pointer this close to the marker line (in pixels) grabs the marker instead of starting a zoom. */
export const MARKER_GRAB_DISTANCE_PX = 8;
export const KEYBOARD_STEP_RATIO = 0.01;
export const KEYBOARD_JUMP_RATIO = 0.1;
export const CROSSHAIR_CHIP_MAX_SPAN_MS = 3 * MILLISECONDS_PER_DAY;
export const CROSSHAIR_CHIP_WIDTH_PX = 104;
export const WHEEL_LINE_HEIGHT_PX = 16;
export const MIN_MAX_LABEL_EDGE_PX = 44;
export const THRESHOLD_BREACH_WIDTH_FACTOR = 2;
export const BAND_OPACITY = 0.14;

export const EVENT_OTHER_COLOR = STATUS_COLORS.info;

export const clipPathId = (idPrefix: string, laneIndex: number): string => `${idPrefix}-clip-${laneIndex}`;
export const hatchPatternId = (idPrefix: string): string => `${idPrefix}-hatch`;

export const PLOT_HELP_LABEL =
  'Chart plot. Move the pointer or use the left and right arrow keys to read values. Drag across the plot to zoom, hold Shift and drag to pan, use plus and minus to zoom and Page Up and Page Down to pan.';
export const PLOT_MARKER_HELP_LABEL =
  'Chart plot in marker mode. Click the plot to place a vertical marker, drag it or use the left and right arrow keys to move it, and press Escape to remove it. Drag across the plot to zoom, use plus and minus to zoom and Page Up and Page Down to pan.';
