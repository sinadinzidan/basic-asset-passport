import { describe, expect, it } from 'vitest';

import { ANNOTATION_COLORS } from '../../constants/annotationColors';
import { ANNOTATION_HOVER_STROKE_WIDTH, ANNOTATION_STROKE_WIDTH } from '../../constants/fileViewer';
import { getAnnotationStyle, transformAnnotation } from '../annotationGeometry';
import type { DocumentAnnotation } from '../types';

const ANNOTATION: DocumentAnnotation = {
  id: 'a1', x: 0.1, y: 0.2, width: 0.3, height: 0.1, page: 1, resourceType: 'asset', annotationType: 'diagrams.AssetLink',
};
const PAGE_WIDTH = 1000;
const PAGE_HEIGHT = 500;

describe('transformAnnotation', () => {
  it('scales the normalised box to the page at no rotation', () => {
    expect(transformAnnotation(ANNOTATION, PAGE_WIDTH, PAGE_HEIGHT, 0)).toEqual({ x: 100, y: 100, width: 300, height: 50 });
  });

  it('turns the box a quarter turn, swapping its width and height', () => {
    const rect = transformAnnotation(ANNOTATION, PAGE_WIDTH, PAGE_HEIGHT, 90);
    expect(rect.x).toBeCloseTo((1 - 0.2 - 0.1) * PAGE_WIDTH);
    expect(rect.y).toBeCloseTo(0.1 * PAGE_HEIGHT);
    expect(rect.width).toBeCloseTo(0.1 * PAGE_WIDTH);
    expect(rect.height).toBeCloseTo(0.3 * PAGE_HEIGHT);
  });

  it('mirrors the box through the page centre at a half turn', () => {
    const rect = transformAnnotation(ANNOTATION, PAGE_WIDTH, PAGE_HEIGHT, 180);
    expect(rect.x).toBeCloseTo((1 - 0.1 - 0.3) * PAGE_WIDTH);
    expect(rect.y).toBeCloseTo((1 - 0.2 - 0.1) * PAGE_HEIGHT);
    expect(rect.width).toBeCloseTo(300);
    expect(rect.height).toBeCloseTo(50);
  });

  it('turns the box three quarter turns, swapping its width and height', () => {
    const rect = transformAnnotation(ANNOTATION, PAGE_WIDTH, PAGE_HEIGHT, 270);
    expect(rect.x).toBeCloseTo(0.2 * PAGE_WIDTH);
    expect(rect.y).toBeCloseTo((1 - 0.1 - 0.3) * PAGE_HEIGHT);
    expect(rect.width).toBeCloseTo(0.1 * PAGE_WIDTH);
    expect(rect.height).toBeCloseTo(0.3 * PAGE_HEIGHT);
  });
});

describe('getAnnotationStyle', () => {
  it('outlines only, with the resource colour, until hovered', () => {
    expect(getAnnotationStyle('asset', false)).toEqual({ stroke: ANNOTATION_COLORS.asset.stroke, fill: 'none', strokeWidth: ANNOTATION_STROKE_WIDTH });
  });

  it('fills and thickens the outline when hovered', () => {
    expect(getAnnotationStyle('diagram', true)).toEqual({ stroke: ANNOTATION_COLORS.diagram.stroke, fill: ANNOTATION_COLORS.diagram.hoverFill, strokeWidth: ANNOTATION_HOVER_STROKE_WIDTH });
  });

  it('falls back to the unknown colour for a resource type it does not know', () => {
    // @ts-expect-error -- a value that arrives from CDF but is outside the declared resource types
    expect(getAnnotationStyle('somethingNew', false).stroke).toBe(ANNOTATION_COLORS.unknown.stroke);
  });
});
