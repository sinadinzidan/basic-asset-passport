import { ANNOTATION_COLORS } from '../constants/annotationColors';
import { ANNOTATION_HOVER_STROKE_WIDTH, ANNOTATION_STROKE_WIDTH, ROTATION_HALF_TURN_DEGREES, ROTATION_QUARTER_TURN_DEGREES, ROTATION_THREE_QUARTER_TURN_DEGREES } from '../constants/fileViewer';

import type { AnnotationResourceType, DocumentAnnotation } from './types';

export function getAnnotationStyle(
  resourceType: AnnotationResourceType,
  isHovered: boolean,
) {
  const colors = ANNOTATION_COLORS[resourceType] ?? ANNOTATION_COLORS.unknown;
  return {
    stroke: colors.stroke,
    fill: isHovered ? colors.hoverFill : 'none',
    strokeWidth: isHovered ? ANNOTATION_HOVER_STROKE_WIDTH : ANNOTATION_STROKE_WIDTH,
  };
}

export function transformAnnotation(
  annotation: DocumentAnnotation,
  w: number,
  h: number,
  rotation: number,
) {
  const { x, y, width, height } = annotation;
  switch (rotation) {
    case ROTATION_QUARTER_TURN_DEGREES:
      return {
        x: (1 - y - height) * w,
        y: x * h,
        width: height * w,
        height: width * h,
      };
    case ROTATION_HALF_TURN_DEGREES:
      return {
        x: (1 - x - width) * w,
        y: (1 - y - height) * h,
        width: width * w,
        height: height * h,
      };
    case ROTATION_THREE_QUARTER_TURN_DEGREES:
      return {
        x: y * w,
        y: (1 - x - width) * h,
        width: height * w,
        height: width * h,
      };
    default:
      return {
        x: x * w,
        y: y * h,
        width: width * w,
        height: height * h,
      };
  }
}
