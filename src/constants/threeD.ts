export const THREE_D_MODEL_NAME = 'Valhall';
export const THREE_D_PLANT_NAME = 'Ruwais';
export const THREE_D_OUTPUT_FORMAT = 'gltf-directory';
export const THREE_D_SCENE_FILE_NAME = 'scene.json';
export const THREE_D_SUPPORTED_SCENE_VERSION = 9;
export const THREE_D_MODEL_LIST_LIMIT = 1000;
export const THREE_D_REVISION_LIST_LIMIT = 100;
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
export const THREE_D_NOT_FOUND_DESCRIPTION =
  'No 3D model named Valhall is published in this project.';
export const THREE_D_CAMERA_INITIAL_NEAR = 0.1;
export const THREE_D_CAMERA_INITIAL_FAR = 1000;
export const THREE_D_CAMERA_MIN_NEAR = 0.01;
export const THREE_D_LIGHT_COLOR = 0xff_ff_ff;
export const DEGREES_PER_HALF_TURN = 180;
export const TRIANGLE_VERTEX_COUNT = 3;
export const THREE_D_ERROR_DESCRIPTION = 'The model could not be fetched from CDF.';
export const THREE_D_NOT_FOUND_TITLE = 'No 3D model';
export const THREE_D_VIEWPORT_LABEL = '3D model viewport';
