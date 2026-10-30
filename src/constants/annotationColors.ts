import type { AnnotationResourceType } from '../cognite-file-viewer/types';

// Drawing colours for annotation outlines on a diagram (matches the cogs.js-v10 design tokens). They are data for
// the overlay, not app theme colours, so they stay the same in light and dark mode.
export const ANNOTATION_COLORS: Record<AnnotationResourceType, { stroke: string; hoverFill: string }> = {
  asset: {
    stroke: 'rgb(212, 106, 226)',
    hoverFill: 'rgba(212, 106, 226, 0.15)',
  },
  file: {
    stroke: 'rgb(255, 135, 70)',
    hoverFill: 'rgba(255, 135, 70, 0.15)',
  },
  timeSeries: {
    stroke: 'rgb(164, 178, 252)',
    hoverFill: 'rgba(164, 178, 252, 0.15)',
  },
  sequence: {
    stroke: 'rgb(255, 220, 127)',
    hoverFill: 'rgba(255, 220, 127, 0.15)',
  },
  event: {
    stroke: 'rgb(253, 81, 144)',
    hoverFill: 'rgba(253, 81, 144, 0.15)',
  },
  diagram: {
    stroke: 'rgb(76, 175, 80)',
    hoverFill: 'rgba(76, 175, 80, 0.15)',
  },
  unknown: {
    stroke: 'rgb(89, 89, 89)',
    hoverFill: 'rgba(89, 89, 89, 0.15)',
  },
};
