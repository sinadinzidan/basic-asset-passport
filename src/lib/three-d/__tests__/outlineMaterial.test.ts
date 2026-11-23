import { BackSide } from 'three';
import { describe, expect, it } from 'vitest';

import { THREE_D_OUTLINE_COLOR, THREE_D_OUTLINE_WIDTH_PIXELS } from '../../../constants/threeD';
import { createHighlightUniform } from '../highlightMaterial';
import { createOutlineMaterial, createViewportUniform } from '../outlineMaterial';

describe(createOutlineMaterial.name, () => {
  it('draws only the back faces so the hull shows around the asset', () => {
    const material = createOutlineMaterial(createHighlightUniform(), createViewportUniform());

    expect(material.side).toBe(BackSide);
  });

  it('shares the hovered asset and the viewport size with the shader', () => {
    const hovered = createHighlightUniform();
    const viewport = createViewportUniform();

    const material = createOutlineMaterial(hovered, viewport);

    expect(material.uniforms.uHighlightedIndex).toBe(hovered);
    expect(material.uniforms.uViewport).toBe(viewport);
  });

  it('uses the outline colour and width', () => {
    const material = createOutlineMaterial(createHighlightUniform(), createViewportUniform());

    expect(material.uniforms.uOutlineColor.value.getHex()).toBe(THREE_D_OUTLINE_COLOR);
    expect(material.uniforms.uOutlineWidth.value).toBe(THREE_D_OUTLINE_WIDTH_PIXELS);
  });

  it('pushes the vertices of every other asset out of view', () => {
    const material = createOutlineMaterial(createHighlightUniform(), createViewportUniform());

    expect(material.vertexShader).toContain('abs(assetIndex - uHighlightedIndex) > 0.5');
  });

  it('keeps the viewport size in pixels', () => {
    const viewport = createViewportUniform();

    expect(viewport.value.toArray()).toEqual([1, 1]);
  });
});
