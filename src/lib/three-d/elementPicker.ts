import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { Color, DoubleSide, ShaderMaterial, UnsignedByteType, WebGLRenderTarget } from 'three';

import type { PickPoint } from './hoverState';
import { decodePickColor } from './pickCodec';

const PICK_VERTEX_SHADER = `
attribute float assetIndex;
varying float vAssetIndex;
void main() {
  vAssetIndex = assetIndex;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PICK_FRAGMENT_SHADER = `
varying float vAssetIndex;
void main() {
  float id = floor(vAssetIndex + 0.5) + 1.0;
  float red = mod(id, 256.0);
  float green = mod(floor(id / 256.0), 256.0);
  float blue = floor(id / 65536.0);
  gl_FragColor = vec4(red / 255.0, green / 255.0, blue / 255.0, 1.0);
}
`;

const PIXEL_SIZE = 1;
const CHANNELS = 4;
const RED = 0;
const GREEN = 1;
const BLUE = 2;

export class ElementPicker {
  private readonly target = new WebGLRenderTarget(PIXEL_SIZE, PIXEL_SIZE, {
    type: UnsignedByteType,
  });
  private readonly material = new ShaderMaterial({
    vertexShader: PICK_VERTEX_SHADER,
    fragmentShader: PICK_FRAGMENT_SHADER,
    side: DoubleSide,
  });
  private readonly pixel = new Uint8Array(CHANNELS);
  private readonly previousClearColor = new Color();

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly container: HTMLElement,
  ) {}

  pick({ x, y }: PickPoint): number | null {
    const { clientWidth, clientHeight } = this.container;

    if (clientWidth === 0 || clientHeight === 0) return null;

    const { background } = this.scene;
    const previousClearAlpha = this.renderer.getClearAlpha();

    this.renderer.getClearColor(this.previousClearColor);
    this.camera.setViewOffset(clientWidth, clientHeight, x, y, PIXEL_SIZE, PIXEL_SIZE);
    this.scene.background = null;
    this.scene.overrideMaterial = this.material;
    this.renderer.setClearColor(0x00_00_00, 0);
    this.renderer.setRenderTarget(this.target);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(this.target, 0, 0, PIXEL_SIZE, PIXEL_SIZE, this.pixel);
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(this.previousClearColor, previousClearAlpha);
    this.scene.overrideMaterial = null;
    this.scene.background = background;
    this.camera.clearViewOffset();

    return decodePickColor(this.pixel[RED], this.pixel[GREEN], this.pixel[BLUE]);
  }

  dispose(): void {
    this.target.dispose();
    this.material.dispose();
  }
}
