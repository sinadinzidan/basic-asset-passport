import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  DEGREES_PER_HALF_TURN,
  THREE_D_AMBIENT_LIGHT_INTENSITY,
  THREE_D_CAMERA_INITIAL_FAR,
  THREE_D_CAMERA_INITIAL_NEAR,
  THREE_D_CAMERA_MIN_NEAR,
  THREE_D_LIGHT_COLOR,
  THREE_D_BACKGROUND_COLOR,
  THREE_D_CAMERA_DIRECTION,
  THREE_D_CAMERA_FAR_RATIO,
  THREE_D_CAMERA_FIELD_OF_VIEW,
  THREE_D_CAMERA_FIT_MARGIN,
  THREE_D_CAMERA_NEAR_RATIO,
  THREE_D_DIRECTIONAL_LIGHT_INTENSITY,
  THREE_D_MAX_PIXEL_RATIO,
  THREE_D_FOCUS_DURATION_MS,
  THREE_D_NO_ASSET,
  THREE_D_NO_HIGHLIGHT,
  THREE_D_OUTLINE_LAYER,
  THREE_D_ZOOM_IN_FACTOR,
  THREE_D_ZOOM_OUT_FACTOR,
} from '../../constants/threeD';
import { ThreeDInteractionMode } from '../../enums/threeDInteractionMode';
import type {
  TessellatedMesh,
  ThreeDAssetLookup,
  ThreeDHover,
  ThreeDModel,
} from '../../types/threeD';
import type { ThreeDRenderer } from '../../types/threeDRenderer';

import { createAnchorAccumulator } from './assetAnchors';
import { easeInOut, focusPose, type CameraPose } from './cameraFocus';
import { zoomedPosition } from './cameraZoom';
import { ElementPicker } from './elementPicker';
import { createHighlightMaterial, createHighlightUniform } from './highlightMaterial';
import { createHoverState } from './hoverState';
import { applyInteractionMode } from './interactionMode';
import { createMarkerLayer, type MarkerAnchor, type MarkerProjection } from './markerLayer';
import { computeModelMatrix, transformBox } from './modelMatrix';
import { createOutlineMaterial, createViewportUniform } from './outlineMaterial';
import { createRenderGate } from './renderGate';

const VECTOR_SIZE = 3;
const HALF = 0.5;

class SceneRenderer implements ThreeDRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly group = new Group();
  private readonly highlighted = createHighlightUniform();
  private readonly material = createHighlightMaterial(this.highlighted);
  private readonly viewport = createViewportUniform();
  private readonly outlineMaterial = createOutlineMaterial(this.highlighted, this.viewport);
  private readonly outlines: Mesh[] = [];
  private readonly hover = createHoverState();
  private readonly picker: ElementPicker;
  private readonly resizeObserver: ResizeObserver;
  private readonly parts: {
    geometry: BufferGeometry;
    positions: Float32Array;
    treeIndices: Float32Array;
  }[] = [];
  private readonly anchors = createAnchorAccumulator();
  private readonly markers: ReturnType<typeof createMarkerLayer>;
  private lookup: ThreeDAssetLookup | null = null;
  private focus: { from: CameraPose; to: CameraPose; startedAt: number } | null = null;
  private hoverListener: (hover: ThreeDHover | null) => void = () => undefined;
  private readonly gate = createRenderGate();
  private frameHandle = 0;
  private isDisposed = false;

  private readonly sun: DirectionalLight;

  constructor(
    private readonly container: HTMLElement,
    private readonly model: ThreeDModel,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, THREE_D_MAX_PIXEL_RATIO));
    this.scene.background = new Color(THREE_D_BACKGROUND_COLOR);

    this.camera = new PerspectiveCamera(
      THREE_D_CAMERA_FIELD_OF_VIEW,
      1,
      THREE_D_CAMERA_INITIAL_NEAR,
      THREE_D_CAMERA_INITIAL_FAR,
    );

    this.camera.layers.enable(THREE_D_OUTLINE_LAYER);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    applyInteractionMode(this.controls, ThreeDInteractionMode.ORBIT);
    this.picker = new ElementPicker(this.renderer, this.scene, this.camera, this.container);
    this.controls.addEventListener('end', this.handleCameraSettled);
    this.controls.addEventListener('start', this.cancelFocus);
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.addEventListener('pointerdown', this.clearHover);
    this.renderer.domElement.addEventListener('pointerleave', this.clearHover);

    const matrix = computeModelMatrix({ ...model, unit: model.scene.unit });

    this.group.matrixAutoUpdate = false;
    this.group.matrix.copy(matrix);
    this.scene.add(this.group);
    this.scene.add(new AmbientLight(THREE_D_LIGHT_COLOR, THREE_D_AMBIENT_LIGHT_INTENSITY));

    this.sun = new DirectionalLight(THREE_D_LIGHT_COLOR, THREE_D_DIRECTIONAL_LIGHT_INTENSITY);

    this.scene.add(this.sun);
    this.frame(model, this.sun);

    this.container.appendChild(this.renderer.domElement);
    this.markers = createMarkerLayer(this.container, (asset) => this.focusAsset(asset));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.animate();
  }

  addSector(mesh: TessellatedMesh): void {
    if (this.isDisposed || mesh.indices.length === 0) return;

    const geometry = new BufferGeometry();

    geometry.setAttribute('position', new BufferAttribute(mesh.positions, VECTOR_SIZE));
    geometry.setAttribute('normal', new BufferAttribute(mesh.normals, VECTOR_SIZE));
    geometry.setAttribute('color', new BufferAttribute(mesh.colors, VECTOR_SIZE));

    const assetIndices = this.assetIndicesFor(mesh.treeIndices);

    geometry.setAttribute('assetIndex', new BufferAttribute(assetIndices, 1));

    geometry.setIndex(new BufferAttribute(mesh.indices, 1));
    geometry.computeBoundingSphere();
    this.parts.push({ geometry, positions: mesh.positions, treeIndices: mesh.treeIndices });
    this.anchors.add(mesh.positions, assetIndices);
    this.refreshMarkers();
    this.group.add(new Mesh(geometry, this.material));

    const outline = new Mesh(geometry, this.outlineMaterial);

    outline.layers.set(THREE_D_OUTLINE_LAYER);
    outline.visible = this.highlighted.value >= 0;
    this.outlines.push(outline);
    this.group.add(outline);
    this.hover.viewChanged();
    this.gate.markDirty();
  }

  setAssetLookup(lookup: ThreeDAssetLookup): void {
    if (this.isDisposed) return;

    this.lookup = lookup;

    this.anchors.reset();

    this.parts.forEach(({ geometry, positions, treeIndices }) => {
      const assetIndices = lookup.indicesFor(treeIndices);

      geometry.setAttribute('assetIndex', new BufferAttribute(assetIndices, 1));
      this.anchors.add(positions, assetIndices);
    });

    this.refreshMarkers();

    this.setHighlighted(THREE_D_NO_HIGHLIGHT);
    this.hoverListener(null);
    this.hover.viewChanged();
  }

  setHoverListener(listener: (hover: ThreeDHover | null) => void): void {
    this.hoverListener = listener;
  }

  setInteractionMode(mode: ThreeDInteractionMode): void {
    if (this.isDisposed) return;

    applyInteractionMode(this.controls, mode);
  }

  zoomIn(): void {
    this.zoomBy(THREE_D_ZOOM_IN_FACTOR);
  }

  zoomOut(): void {
    this.zoomBy(THREE_D_ZOOM_OUT_FACTOR);
  }

  resetView(): void {
    this.focus = null;
    this.frame(this.model, this.sun);
    this.hover.viewChanged();
    this.gate.markDirty();
  }

  dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controls.removeEventListener('end', this.handleCameraSettled);
    this.controls.removeEventListener('start', this.cancelFocus);
    this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.clearHover);
    this.renderer.domElement.removeEventListener('pointerleave', this.clearHover);
    this.controls.dispose();
    this.picker.dispose();
    this.parts.forEach(({ geometry }) => geometry.dispose());
    this.material.dispose();
    this.outlineMaterial.dispose();
    this.markers.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private focusAsset(asset: number): void {
    const center = this.anchors.anchors().get(asset);
    const radius = this.anchors.radii().get(asset);

    if (center === undefined || radius === undefined) return;

    const world = new Vector3(...center).applyMatrix4(this.group.matrix);
    const scale = new Vector3().setFromMatrixScale(this.group.matrix).x;
    const { position } = this.camera;
    const { target } = this.controls;

    const from: CameraPose = {
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z],
    };

    const to = focusPose(from, [world.x, world.y, world.z], radius * scale);

    const distance = Math.hypot(
      to.position[0] - to.target[0],
      to.position[1] - to.target[1],
      to.position[2] - to.target[2],
    );

    this.camera.near = Math.min(this.camera.near, distance * THREE_D_CAMERA_NEAR_RATIO);
    this.camera.updateProjectionMatrix();
    this.focus = { from, to, startedAt: performance.now() };
    this.gate.markDirty();
  }

  private advanceFocus(): void {
    if (this.focus === null) return;

    const { from, to, startedAt } = this.focus;
    const progress = (performance.now() - startedAt) / THREE_D_FOCUS_DURATION_MS;
    const eased = easeInOut(progress);
    const blend = (start: number, end: number): number => start + (end - start) * eased;

    this.camera.position.set(
      blend(from.position[0], to.position[0]),
      blend(from.position[1], to.position[1]),
      blend(from.position[2], to.position[2]),
    );

    this.controls.target.set(
      blend(from.target[0], to.target[0]),
      blend(from.target[1], to.target[1]),
      blend(from.target[2], to.target[2]),
    );

    this.controls.update();
    this.gate.markDirty();

    if (progress >= 1) {
      this.focus = null;
      this.hover.viewChanged();
    }
  }

  private cancelFocus = (): void => {
    this.focus = null;
  };

  private refreshMarkers(): void {
    const { lookup } = this;

    if (lookup === null) return;

    const anchors = new Map(
      [...this.anchors.anchors()].flatMap(([asset, position]) => {
        const name = lookup.nameAt(asset);

        return name === null ? [] : [[asset, { position, name }] as const];
      }),
    );

    this.markers.setAnchors(anchors);
  }

  private projectMarker({ position }: MarkerAnchor): MarkerProjection {
    const projected = new Vector3(...position).applyMatrix4(this.group.matrix).project(this.camera);
    const { clientWidth, clientHeight } = this.container;

    return {
      x: (projected.x * HALF + HALF) * clientWidth,
      y: (HALF - projected.y * HALF) * clientHeight,
      isVisible: projected.z > -1 && projected.z < 1,
    };
  }

  private assetIndicesFor(treeIndices: Float32Array): Float32Array {
    return this.lookup === null
      ? new Float32Array(treeIndices.length).fill(THREE_D_NO_ASSET)
      : this.lookup.indicesFor(treeIndices);
  }

  private zoomBy(factor: number): void {
    const { position } = this.camera;
    const { target } = this.controls;

    const next = zoomedPosition(
      [position.x, position.y, position.z],
      [target.x, target.y, target.z],
      factor,
    );

    this.camera.position.set(next[0], next[1], next[2]);
    this.controls.update();
    this.hover.viewChanged();
    this.gate.markDirty();
  }

  private frame(model: ThreeDModel, sun: DirectionalLight): void {
    const box = transformBox(model.scene.boundingBox, this.group.matrix);
    const center = box.getCenter(new Vector3());
    const radius = box.getSize(new Vector3()).length() * HALF;

    const distance =
      (radius / Math.sin((THREE_D_CAMERA_FIELD_OF_VIEW * HALF * Math.PI) / DEGREES_PER_HALF_TURN)) *
      THREE_D_CAMERA_FIT_MARGIN;

    const direction = new Vector3(...THREE_D_CAMERA_DIRECTION).normalize();

    this.camera.near = Math.max(radius * THREE_D_CAMERA_NEAR_RATIO, THREE_D_CAMERA_MIN_NEAR);
    this.camera.far = radius * THREE_D_CAMERA_FAR_RATIO + distance;
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();
    sun.position.copy(center).addScaledVector(direction, radius);
  }

  private resize(): void {
    const { clientWidth, clientHeight } = this.container;

    if (clientWidth === 0 || clientHeight === 0) return;

    this.renderer.setSize(clientWidth, clientHeight);
    this.viewport.value.set(clientWidth, clientHeight);
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.gate.markDirty();
  }

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.buttons !== 0) return;

    const bounds = this.renderer.domElement.getBoundingClientRect();

    this.hover.pointerMoved(event.clientX - bounds.left, event.clientY - bounds.top);
  };

  private handleCameraSettled = (): void => {
    this.hover.viewChanged();
  };

  private setHighlighted(assetIndex: number): void {
    this.highlighted.value = assetIndex;

    const isOutlined = assetIndex >= 0;

    this.outlines.forEach((outline) => {
      outline.visible = isOutlined;
    });

    this.gate.markDirty();
  }

  private clearHover = (): void => {
    if (this.hover.pointerLeft()) {
      this.setHighlighted(THREE_D_NO_HIGHLIGHT);
      this.hoverListener(null);
    }
  };

  private updateHover(): void {
    const point = this.hover.takePendingPoint();

    if (point === null) return;

    const assetIndex = this.picker.pick(point);

    if (this.hover.setHovered(assetIndex)) {
      this.setHighlighted(assetIndex ?? THREE_D_NO_HIGHLIGHT);
    }

    const name = assetIndex === null ? null : (this.lookup?.nameAt(assetIndex) ?? null);

    this.hoverListener(name === null ? null : { name, x: point.x, y: point.y });
  }

  private animate = (): void => {
    if (this.isDisposed) return;

    this.advanceFocus();

    const hasControlsChanged = this.controls.update();

    this.updateHover();

    if (this.gate.consume(hasControlsChanged)) {
      this.renderer.render(this.scene, this.camera);
      this.markers.update((anchor) => this.projectMarker(anchor));
    }

    this.frameHandle = requestAnimationFrame(this.animate);
  };
}

export function createSceneRenderer(container: HTMLElement, model: ThreeDModel): ThreeDRenderer {
  return new SceneRenderer(container, model);
}
