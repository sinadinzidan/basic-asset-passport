import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DocumentAnnotationOverlay } from '../DocumentAnnotationOverlay';
import type { DocumentAnnotation } from '../types';

const annotation: DocumentAnnotation = {
  id: 'a', x: 0.1, y: 0.2, width: 0.3, height: 0.4, page: 1,
  resourceType: 'asset', annotationType: 'diagrams.AssetLink', text: 'Pump P-101',
};

describe('DocumentAnnotationOverlay', () => {
  it('maps normalized diagram bounds and handles hover and click', () => {
    const onClick = vi.fn();
    const onHover = vi.fn();
    const { container } = render(<DocumentAnnotationOverlay annotations={[annotation]} containerWidth={1000} containerHeight={500} onAnnotationClick={onClick} onAnnotationHover={onHover} />);
    const rectangle = container.querySelector('rect');
    expect(rectangle).toHaveAttribute('x', '100');
    expect(rectangle).toHaveAttribute('y', '100');
    expect(rectangle).toHaveAttribute('width', '300');
    expect(screen.getByText('Pump P-101')).toBeInTheDocument();
    if (!rectangle) throw new Error('Missing annotation rectangle');
    fireEvent.mouseEnter(rectangle);
    expect(onHover).toHaveBeenCalledWith(annotation);
    fireEvent.click(rectangle);
    expect(onClick).toHaveBeenCalledWith(annotation);
    fireEvent.mouseLeave(rectangle);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it('handles empty annotations and rotated pages', () => {
    const { container, rerender } = render(<DocumentAnnotationOverlay annotations={[]} containerWidth={1000} containerHeight={500} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<DocumentAnnotationOverlay annotations={[annotation]} containerWidth={1000} containerHeight={500} rotation={90} />);
    expect(container.querySelector('rect')).toHaveAttribute('width', '400');
    expect(container.querySelector('rect')).toHaveAttribute('height', '150');
  });
});
