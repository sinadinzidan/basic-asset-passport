import {
  THREE_D_FOCUS_LABEL,
  THREE_D_MARKER_SIZE_PX,
  THREE_D_TONE_COLORS,
} from '../../constants/threeD';
import type { Vector } from '../../types/threeD';
import { getCriticalityTone } from '../assetCriticality';

export type MarkerAnchor = { position: Vector; name: string; criticality: string };
export type MarkerProjection = { x: number; y: number; isVisible: boolean };

const HEX_RADIX = 16;
const HEX_DIGITS = 6;
const HALF = 0.5;
const ACTIVATION_KEYS = new Set(['Enter', ' ']);

const toCss = (hex: number): string => `#${hex.toString(HEX_RADIX).padStart(HEX_DIGITS, '0')}`;

function createMarker(anchor: MarkerAnchor, onSelect: () => void): HTMLElement {
  const { name, criticality } = anchor;
  const tone = getCriticalityTone(criticality);
  const color = toCss(THREE_D_TONE_COLORS[tone]);
  const marker = document.createElement('div');
  const dot = document.createElement('span');
  const pill = document.createElement('span');
  const label = document.createElement('span');
  const badge = document.createElement('span');

  marker.dataset.assetMarker = '';
  marker.setAttribute('role', 'button');
  marker.setAttribute('tabindex', '0');
  marker.setAttribute('aria-label', `${THREE_D_FOCUS_LABEL} ${name}, criticality ${criticality}`);
  marker.addEventListener('click', onSelect);

  marker.addEventListener('keydown', (event) => {
    if (ACTIVATION_KEYS.has(event.key)) {
      event.preventDefault();
      onSelect();
    }
  });

  Object.assign(marker.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    display: 'none',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'auto',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  Object.assign(dot.style, {
    width: `${THREE_D_MARKER_SIZE_PX}px`,
    height: `${THREE_D_MARKER_SIZE_PX}px`,
    marginLeft: `${-THREE_D_MARKER_SIZE_PX * HALF}px`,
    borderRadius: '50%',
    background: color,
    border: '2px solid rgba(15, 23, 42, 0.85)',
    boxShadow: `0 0 0 3px ${color}40`,
    boxSizing: 'border-box',
  });

  Object.assign(pill.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 4px 3px 9px',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
    color: '#f1f5f9',
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '1',
    letterSpacing: '0.02em',
  });

  Object.assign(badge.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    borderRadius: '999px',
    background: color,
    color: '#0b1220',
    fontSize: '10px',
    fontWeight: '800',
  });

  badge.dataset.criticality = '';
  badge.dataset.tone = tone;
  badge.textContent = criticality;
  label.textContent = name;
  pill.append(label, badge);
  marker.append(dot, pill);

  return marker;
}

export function createMarkerLayer(container: HTMLElement, onSelect: (asset: number) => void) {
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

        const element = createMarker(anchor, () => onSelect(asset));

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
