import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentAnnotationOverlay } from '../DocumentAnnotationOverlay';
import type { DocumentAnnotation } from '../types';

const annotation: DocumentAnnotation = {
  id: 'a1',
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.1,
  page: 1,
  resourceType: 'asset',
  annotationType: 'diagrams.AssetLink',
  linkedResource: { space: 'asset-space', externalId: 'FLOC-9' },
};

describe(DocumentAnnotationOverlay.name, () => {
  it('draws a box at the annotation position', () => {
    const { container } = render(
      <DocumentAnnotationOverlay annotations={[annotation]} containerWidth={1000} containerHeight={500} />,
    );

    const box = container.querySelector('rect');
    expect(box).toHaveAttribute('x', '100');
    expect(box).toHaveAttribute('y', '100');
    expect(box).toHaveAttribute('width', '300');
    expect(box).toHaveAttribute('height', '50');
  });

  it('reports the clicked annotation with the box that was clicked', async () => {
    const onAnnotationClick = vi.fn();
    const { container } = render(
      <DocumentAnnotationOverlay
        annotations={[annotation]}
        containerWidth={1000}
        containerHeight={500}
        onAnnotationClick={onAnnotationClick}
      />,
    );
    const box = container.querySelector('rect');
    if (!box) throw new Error('The annotation box was not drawn.');

    await userEvent.click(box);

    expect(onAnnotationClick).toHaveBeenCalledExactlyOnceWith(annotation, box);
  });

  it('takes clicks anywhere inside the box, not only on its outline', () => {
    const { container } = render(
      <DocumentAnnotationOverlay annotations={[annotation]} containerWidth={1000} containerHeight={500} />,
    );

    // The box has no fill, so "all" is what makes its inside hit-testable above the page's text.
    expect(container.querySelector('rect')).toHaveStyle({ pointerEvents: 'all' });
  });

  it('draws nothing before the page has a size', () => {
    const { container } = render(
      <DocumentAnnotationOverlay annotations={[annotation]} containerWidth={0} containerHeight={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
