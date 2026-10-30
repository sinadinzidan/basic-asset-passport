import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { getAnnotationStyle, transformAnnotation } from './annotationGeometry';
import type { DocumentAnnotation, BoundingRect } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DocumentAnnotationOverlayProps {
  /** Annotations to render (coordinates are normalised 0-1) */
  annotations: DocumentAnnotation[];
  /** Rendered page width in CSS pixels */
  containerWidth: number;
  /** Rendered page height in CSS pixels */
  containerHeight: number;
  /** Document rotation in degrees (0, 90, 180, 270) */
  rotation?: number;
  /** Called when a user clicks an annotation */
  onAnnotationClick?: (annotation: DocumentAnnotation) => void;
  /** Called when a user hovers over / leaves an annotation */
  onAnnotationHover?: (annotation: DocumentAnnotation | null) => void;
  /** Render a custom tooltip for hovered annotations. Receives the annotation and its pixel-space bounding rect. */
  renderAnnotationTooltip?: (
    annotation: DocumentAnnotation,
    rect: BoundingRect,
  ) => ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export const DocumentAnnotationOverlay: FC<
  DocumentAnnotationOverlayProps
> = ({
  annotations,
  containerWidth,
  containerHeight,
  rotation = 0,
  onAnnotationClick,
  onAnnotationHover,
  renderAnnotationTooltip,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredAnnotation = hoveredId
    ? annotations.find((a) => a.id === hoveredId)
    : null;
  const hoveredRect = hoveredAnnotation
    ? transformAnnotation(hoveredAnnotation, containerWidth, containerHeight, rotation)
    : null;

  if (annotations.length === 0 || containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  return (
    <>
      <svg
        className="pointer-events-none absolute top-0 left-0 z-10 size-full overflow-visible"
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      >
        {annotations.map((annotation) => {
          const isHovered = hoveredId === annotation.id;
          const style = getAnnotationStyle(annotation.resourceType, isHovered);
          const rect = transformAnnotation(
            annotation,
            containerWidth,
            containerHeight,
            rotation,
          );

          return (
            <rect
              key={annotation.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              rx={1}
              ry={1}
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => {
                setHoveredId(annotation.id);
                onAnnotationHover?.(annotation);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                onAnnotationHover?.(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAnnotationClick?.(annotation);
              }}
            >
              {!renderAnnotationTooltip && annotation.text && (
                <title>{annotation.text}</title>
              )}
            </rect>
          );
        })}
      </svg>
      {renderAnnotationTooltip && hoveredAnnotation && hoveredRect && (
        renderAnnotationTooltip(hoveredAnnotation, hoveredRect)
      )}
    </>
  );
};
