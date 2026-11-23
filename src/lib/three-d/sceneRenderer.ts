import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshLambertMaterial,
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
  THREE_D_ZOOM_IN_FACTOR,
  THREE_D_ZOOM_OUT_FACTOR,
} from '../../constants/threeD';
import type { TessellatedMesh, ThreeDModel } from '../../types/threeD';
import type { ThreeDRenderer } from '../../types/threeDRenderer';

import { zoomedPosition } from './cameraZoom';
import { computeModelMatrix, transformBox } from './modelMatrix';
import { createRenderGate } from './renderGate';

const VECTOR_SIZE = 3;
const HALF = 0.5;

class SceneRenderer implements ThreeDRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly group = new Group();
  private readonly material = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  private readonly resizeObserver: ResizeObserver;
  private readonly geometries: BufferGeometry[] = [];
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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const matrix = computeModelMatrix({ ...model, unit: model.scene.unit });

    this.group.matrixAutoUpdate = false;
    this.group.matrix.copy(matrix);
    this.scene.add(this.group);
    this.scene.add(new AmbientLight(THREE_D_LIGHT_COLOR, THREE_D_AMBIENT_LIGHT_INTENSITY));

    this.sun = new DirectionalLight(THREE_D_LIGHT_COLOR, THREE_D_DIRECTIONAL_LIGHT_INTENSITY);

    this.scene.add(this.sun);
    this.frame(model, this.sun);

    this.container.appendChild(this.renderer.domElement);
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
    geometry.setIndex(new BufferAttribute(mesh.indices, 1));
    geometry.computeBoundingSphere();
    this.geometries.push(geometry);
    this.group.add(new Mesh(geometry, this.material));
    this.gate.markDirty();
  }

  zoomIn(): void {
    this.zoomBy(THREE_D_ZOOM_IN_FACTOR);
  }

  zoomOut(): void {
    this.zoomBy(THREE_D_ZOOM_OUT_FACTOR);
  }

  resetView(): void {
    this.frame(this.model, this.sun);
    this.gate.markDirty();
  }

  dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
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
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.gate.markDirty();
  }

  private animate = (): void => {
    if (this.isDisposed) return;

    const hasControlsChanged = this.controls.update();

    if (this.gate.consume(hasControlsChanged)) {
      this.renderer.render(this.scene, this.camera);
    }

    this.frameHandle = requestAnimationFrame(this.animate);
  };
}

export function createSceneRenderer(container: HTMLElement, model: ThreeDModel): ThreeDRenderer {
  return new SceneRenderer(container, model);
}
