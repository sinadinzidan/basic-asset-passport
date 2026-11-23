import { Color, DoubleSide, MeshLambertMaterial } from 'three';

import {
  THREE_D_HIGHLIGHT_COLOR,
  THREE_D_HIGHLIGHT_MIX,
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
    shader.uniforms.uHighlightColor = { value: new Color(THREE_D_HIGHLIGHT_COLOR) };
    shader.uniforms.uHighlightMix = { value: THREE_D_HIGHLIGHT_MIX };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float treeIndex;\nvarying float vTreeIndex;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTreeIndex = treeIndex;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vTreeIndex;\nuniform float uHighlightedIndex;\nuniform vec3 uHighlightColor;\nuniform float uHighlightMix;',
      )
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nif (abs(vTreeIndex - uHighlightedIndex) < 0.5) {\n  diffuseColor.rgb = mix(diffuseColor.rgb, uHighlightColor, uHighlightMix);\n}',
      );
  };

  return material;
}
