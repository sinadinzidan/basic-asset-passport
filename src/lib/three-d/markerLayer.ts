import {
  THREE_D_ASSET_COLOR,
  THREE_D_MARKER_SIZE_PX,
  THREE_D_OUTLINE_COLOR,
} from '../../constants/threeD';
import type { Vector } from '../../types/threeD';

export type MarkerAnchor = { position: Vector; name: string };
export type MarkerProjection = { x: number; y: number; isVisible: boolean };

const HEX_RADIX = 16;
const HEX_DIGITS = 6;
const HALF = 0.5;

const toCss = (hex: number): string => `#${hex.toString(HEX_RADIX).padStart(HEX_DIGITS, '0')}`;

function createMarker(name: string): HTMLElement {
  const marker = document.createElement('div');
  const dot = document.createElement('span');
  const label = document.createElement('span');

  marker.dataset.assetMarker = '';

  Object.assign(marker.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    display: 'none',
    alignItems: 'center',
    gap: '4px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    fontSize: '10px',
    lineHeight: '1',
    color: toCss(THREE_D_ASSET_COLOR),
    textShadow: '0 0 3px #000, 0 0 3px #000',
  });

  Object.assign(dot.style, {
    width: `${THREE_D_MARKER_SIZE_PX}px`,
    height: `${THREE_D_MARKER_SIZE_PX}px`,
    marginLeft: `${-THREE_D_MARKER_SIZE_PX * HALF}px`,
    borderRadius: '50%',
    background: toCss(THREE_D_ASSET_COLOR),
    border: `2px solid ${toCss(THREE_D_OUTLINE_COLOR)}`,
    boxSizing: 'border-box',
  });

  label.textContent = name;
  marker.append(dot, label);

  return marker;
}

export function createMarkerLayer(container: HTMLElement) {
  const layer = document.createElement('div');
  const markers = new Map<number, { element: HTMLElement; anchor: MarkerAnchor }>();

  Object.assign(layer.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
  });

  container.append(layer);

  return {
    setAnchors(anchors: ReadonlyMap<number, MarkerAnchor>): void {
      anchors.forEach((anchor, asset) => {
        const existing = markers.get(asset);

        if (existing !== undefined) {
          existing.anchor = anchor;

          return;
        }

        const element = createMarker(anchor.name);

        layer.append(element);
        markers.set(asset, { element, anchor });
      });
    },
    update(project: (anchor: MarkerAnchor) => MarkerProjection): void {
      markers.forEach(({ element, anchor }) => {
        const { x, y, isVisible } = project(anchor);

        element.style.display = isVisible ? 'flex' : 'none';

        if (isVisible) element.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
      });
    },
    dispose(): void {
      markers.clear();
      layer.remove();
    },
  };
}
