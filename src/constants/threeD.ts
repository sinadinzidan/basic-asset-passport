import type { ThreeDModelReference as ThreeDModelReference } from '../types/threeD';

export const THREE_D_MODEL_NAME = 'Platform VPH';
export const THREE_D_MODEL_ID = 2_784_752_287_179_751;
export const THREE_D_REVISION_ID = 1_423_667_588_626_776;
export const THREE_D_MODEL_REFERENCE: ThreeDModelReference = {
  name: THREE_D_MODEL_NAME,
  modelId: THREE_D_MODEL_ID,
  revisionId: THREE_D_REVISION_ID,
};
export const THREE_D_PLANT_NAME = 'Ruwais';
export const THREE_D_OUTPUT_FORMAT = 'gltf-directory';
export const THREE_D_SCENE_FILE_NAME = 'scene.json';
export const THREE_D_SUPPORTED_SCENE_VERSION = 9;
export const THREE_D_MAX_WORKERS = 4;
export const THREE_D_FALLBACK_CORES = 2;
export const THREE_D_SECTOR_CONCURRENCY = 6;
export const THREE_D_MAX_DOWNLOAD_BYTES = 209_715_200;
export const THREE_D_QUERY_STALE_TIME_MS = 300_000;
export const THREE_D_FILES_PATH = '3d/files';
export const THREE_D_CAMERA_FIELD_OF_VIEW = 50;
export const THREE_D_CAMERA_NEAR_RATIO = 0.001;
export const THREE_D_CAMERA_FAR_RATIO = 20;
export const THREE_D_CAMERA_FIT_MARGIN = 1.2;
export const THREE_D_BACKGROUND_COLOR = 0x10_1a_2e;

export const FULL_TURN = 6.283185307179586;
export const HALF_TURN = Math.PI;
export const FULL_TURN_TOLERANCE = 0.001;

export const BOX_HALF = 0.5;
export const NUT_SIDES = 6;
export const FULL_CIRCLE_SEGMENTS = 20;
export const MIN_ARC_SEGMENTS = 2;
export const TORUS_TUBE_SEGMENTS = 8;
export const TORUS_ARC_SEGMENTS = 16;
export const ELLIPSOID_RINGS = 8;
export const THREE_D_DEFAULT_COLOR_COMPONENT = 0.7;
export const THREE_D_AMBIENT_LIGHT_INTENSITY = 0.9;
export const THREE_D_DIRECTIONAL_LIGHT_INTENSITY = 1.4;
export const THREE_D_LIGHT_DISTANCE_RATIO = 1;
export const THREE_D_MAX_PIXEL_RATIO = 2;
export const THREE_D_CAMERA_ELEVATION = 0.7;
export const THREE_D_CAMERA_DIRECTION: readonly [number, number, number] = [
  1,
  THREE_D_CAMERA_ELEVATION,
  1,
];
export const THREE_D_LOADING_MESSAGE = 'Loading 3D model…';
export const THREE_D_ERROR_TITLE = 'Could not load the 3D model.';
export const THREE_D_CAMERA_INITIAL_NEAR = 0.1;
export const THREE_D_CAMERA_INITIAL_FAR = 1000;
export const THREE_D_CAMERA_MIN_NEAR = 0.01;
export const THREE_D_LIGHT_COLOR = 0xff_ff_ff;
export const DEGREES_PER_HALF_TURN = 180;
export const TRIANGLE_VERTEX_COUNT = 3;
export const THREE_D_ERROR_DESCRIPTION = 'The model could not be fetched from CDF.';
export const THREE_D_ASSET_COLOR = 0x22_d3_ee;
export const THREE_D_ASSET_MIX = 0.6;
export const THREE_D_HOVER_COLOR = 0xff_ff_ff;
export const THREE_D_HOVER_MIX = 0.85;
export const THREE_D_OUTLINE_COLOR = 0x0e_74_90;
export const THREE_D_OUTLINE_WIDTH_PIXELS = 3;
export const THREE_D_OUTLINE_LAYER = 1;
export const THREE_D_NO_HIGHLIGHT = -2;
export const THREE_D_NO_ASSET = -1;
export const THREE_D_INSTANCE_SPACE = 'energy_instances';
export const THREE_D_CAD_NODE_VIEW = {
  space: 'cdf_cdm',
  externalId: 'CogniteCADNode',
  version: 'v1',
} as const;
export const THREE_D_CAD_NODE_PAGE_LIMIT = 1000;
export const THREE_D_ZOOM_IN_FACTOR = 0.8;
export const THREE_D_ZOOM_OUT_FACTOR = 1.25;
export const THREE_D_FOCUS_MARGIN = 3;
export const THREE_D_FOCUS_MIN_DISTANCE = 0.5;
export const THREE_D_FOCUS_DURATION_MS = 600;
export const THREE_D_FOCUS_LABEL = 'Zoom to';
export const THREE_D_MARKER_SIZE_PX = 10;
export const THREE_D_LABEL_OFFSET_PX = 14;
export const THREE_D_ORBIT_LABEL = 'Orbit';
export const THREE_D_MOVE_LABEL = 'Move';
export const THREE_D_ZOOM_IN_LABEL = 'Zoom in';
export const THREE_D_ZOOM_OUT_LABEL = 'Zoom out';
export const THREE_D_RESET_VIEW_LABEL = 'Reset view';
export const THREE_D_VIEW_KICKER = '3D model';
export const THREE_D_VIEWPORT_LABEL = '3D model viewport';
