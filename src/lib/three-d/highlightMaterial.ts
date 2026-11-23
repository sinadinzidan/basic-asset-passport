import { Color, DoubleSide, MeshLambertMaterial } from 'three';

import {
  THREE_D_ASSET_COLOR,
  THREE_D_ASSET_MIX,
  THREE_D_HOVER_COLOR,
  THREE_D_HOVER_MIX,
  THREE_D_NO_HIGHLIGHT,
} from '../../constants/threeD';

export type HighlightUniform = { value: number };

export function createHighlightUniform(): HighlightUniform {
  return { value: THREE_D_NO_HIGHLIGHT };
}

export function createHighlightMaterial(highlighted: HighlightUniform): MeshLambertMaterial {
  const material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHighlightedIndex = highlighted;
    shader.uniforms.uAssetColor = { value: new Color(THREE_D_ASSET_COLOR) };
    shader.uniforms.uAssetMix = { value: THREE_D_ASSET_MIX };
    shader.uniforms.uHoverColor = { value: new Color(THREE_D_HOVER_COLOR) };
    shader.uniforms.uHoverMix = { value: THREE_D_HOVER_MIX };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float assetIndex;\nvarying float vAssetIndex;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAssetIndex = assetIndex;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vAssetIndex;\nuniform float uHighlightedIndex;\nuniform vec3 uAssetColor;\nuniform float uAssetMix;\nuniform vec3 uHoverColor;\nuniform float uHoverMix;',
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nif (vAssetIndex > -0.5) {\n  diffuseColor.rgb = mix(diffuseColor.rgb, uAssetColor, uAssetMix);\n}\nif (abs(vAssetIndex - uHighlightedIndex) < 0.5) {\n  diffuseColor.rgb = mix(diffuseColor.rgb, uHoverColor, uHoverMix);\n}',
      );
  };

  return material;
}
