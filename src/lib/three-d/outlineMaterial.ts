import { BackSide, Color, ShaderMaterial, Vector2 } from 'three';

import { THREE_D_OUTLINE_COLOR, THREE_D_OUTLINE_WIDTH_PIXELS } from '../../constants/threeD';

import type { HighlightUniform } from './highlightMaterial';

export type ViewportUniform = { value: Vector2 };

const OUTLINE_VERTEX_SHADER = `
attribute float assetIndex;
uniform float uHighlightedIndex;
uniform float uOutlineWidth;
uniform vec2 uViewport;
void main() {
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  if (abs(assetIndex - uHighlightedIndex) > 0.5) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec4 direction = projectionMatrix * vec4(normalMatrix * normal, 0.0);
  vec2 offset = normalize(direction.xy + vec2(0.00001)) * uOutlineWidth * 2.0 / uViewport;
  clip.xy += offset * clip.w;
  gl_Position = clip;
}
`;

const OUTLINE_FRAGMENT_SHADER = `
uniform vec3 uOutlineColor;
void main() {
  gl_FragColor = vec4(uOutlineColor, 1.0);
}
`;

export function createViewportUniform(): ViewportUniform {
  return { value: new Vector2(1, 1) };
}

export function createOutlineMaterial(
  highlighted: HighlightUniform,
  viewport: ViewportUniform,
): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: OUTLINE_VERTEX_SHADER,
    fragmentShader: OUTLINE_FRAGMENT_SHADER,
    side: BackSide,
    uniforms: {
      uHighlightedIndex: highlighted,
      uViewport: viewport,
      uOutlineColor: { value: new Color(THREE_D_OUTLINE_COLOR) },
      uOutlineWidth: { value: THREE_D_OUTLINE_WIDTH_PIXELS },
    },
  });
}
