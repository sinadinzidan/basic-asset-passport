import type { WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';
import { describe, expect, it } from 'vitest';

import {
  THREE_D_ASSET_COLOR,
  THREE_D_ASSET_MIX,
  THREE_D_HOVER_COLOR,
  THREE_D_NO_HIGHLIGHT,
} from '../../../constants/threeD';
import { createHighlightMaterial, createHighlightUniform } from '../highlightMaterial';

describe(createHighlightMaterial.name, () => {
  it('starts with nothing hovered', () => {
    expect(createHighlightUniform().value).toBe(THREE_D_NO_HIGHLIGHT);
  });

  it('shares the hovered asset with the shader', () => {
    const hovered = createHighlightUniform();

    const { shader } = compile(hovered);

    expect(shader.uniforms.uHighlightedIndex).toBe(hovered);
  });

  it('gives every mapped asset its own colour and the hovered asset another', () => {
    const { shader } = compile(createHighlightUniform());

    expect(shader.uniforms.uAssetColor.value.getHex()).toBe(THREE_D_ASSET_COLOR);
    expect(shader.uniforms.uAssetMix.value).toBe(THREE_D_ASSET_MIX);
    expect(shader.uniforms.uHoverColor.value.getHex()).toBe(THREE_D_HOVER_COLOR);
  });

  it('tints mapped geometry by default and hovered geometry on top', () => {
    const { shader } = compile(createHighlightUniform());

    const tintMapped = shader.fragmentShader.indexOf('vAssetIndex > -0.5');
    const tintHovered = shader.fragmentShader.indexOf('abs(vAssetIndex - uHighlightedIndex)');

    expect(tintMapped).toBeGreaterThan(-1);
    expect(tintHovered).toBeGreaterThan(tintMapped);
  });

  function compile(hovered: ReturnType<typeof createHighlightUniform>) {
    const material = createHighlightMaterial(hovered);

    const shader = {
      uniforms: {},
      vertexShader: '#include <common>\n#include <begin_vertex>',
      fragmentShader: '#include <common>\n#include <color_fragment>',
    } as Partial<WebGLProgramParametersWithUniforms> as WebGLProgramParametersWithUniforms;

    material.onBeforeCompile(shader, {} as Partial<WebGLRenderer> as WebGLRenderer);

    return { shader };
  }
});
