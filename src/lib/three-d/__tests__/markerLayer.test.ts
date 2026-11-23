import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMarkerLayer } from '../markerLayer';

describe(createMarkerLayer.name, () => {
  let container: HTMLElement;

  afterEach(() => container.remove());

  it('adds one marker per anchor inside the container', () => {
    const { layer } = setup();

    layer.setAnchors(
      new Map([
        [0, anchor([0, 0, 0])],
        [4, anchor([1, 1, 1])],
      ]),
    );

    expect(container.querySelectorAll('[data-asset-marker]')).toHaveLength(2);
  });

  it('does not add a marker twice for the same asset', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));
    layer.setAnchors(new Map([[0, anchor([1, 1, 1])]]));

    expect(container.querySelectorAll('[data-asset-marker]')).toHaveLength(1);
  });

  it('moves each marker to where its anchor projects', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([1, 2, 3])]]));
    layer.update(({ position }) => ({
      x: position[0] * 10,
      y: position[1] * 10,
      isVisible: true,
    }));

    const marker = container.querySelector<HTMLElement>('[data-asset-marker]');

    expect(marker?.style.transform).toContain('10px');
    expect(marker?.style.transform).toContain('20px');
    expect(marker?.style.display).not.toBe('none');
  });

  it('hides a marker that is out of view', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));
    layer.update(() => ({ x: 0, y: 0, isVisible: false }));

    expect(container.querySelector<HTMLElement>('[data-asset-marker]')?.style.display).toBe('none');
  });

  it('shows the name of the asset beside each marker', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));

    expect(container.querySelector('[data-asset-marker]')).toHaveTextContent('WMT:1');
  });

  it('shows the criticality as a badge coloured by its tone', () => {
    const { layer } = setup();

    layer.setAnchors(
      new Map([
        [0, { position: [0, 0, 0], name: 'WMT:1', criticality: 'A' }],
        [1, { position: [0, 0, 0], name: 'WMT:2', criticality: 'C' }],
      ]),
    );

    const badges = [...container.querySelectorAll<HTMLElement>('[data-criticality]')];

    expect(badges.map((badge) => badge.textContent)).toEqual(['A', 'C']);
    expect(badges.map((badge) => badge.dataset.tone)).toEqual(['ERROR', 'SUCCESS']);
    expect(badges[0].style.background).not.toBe(badges[1].style.background);
  });

  it('lets the pointer through everywhere except on a marker', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));

    expect(container.querySelector<HTMLElement>('[data-asset-marker]')?.style.pointerEvents).toBe(
      'auto',
    );
    expect(container.firstElementChild).toHaveStyle({ pointerEvents: 'none' });
  });

  it('tells which asset was clicked', () => {
    const { layer, onSelect } = setup();

    layer.setAnchors(new Map([[7, anchor([0, 0, 0])]]));
    container.querySelector<HTMLElement>('[data-asset-marker]')?.click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('can be reached with the keyboard and named for screen readers', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));
    layer.update(() => ({ x: 0, y: 0, isVisible: true }));

    const marker = container.querySelector<HTMLElement>('[data-asset-marker]');

    expect(marker).toHaveAttribute('role', 'button');
    expect(marker).toHaveAttribute('tabindex', '0');
    expect(marker).toHaveAccessibleName('Zoom to WMT:1, criticality A');
  });

  it('removes every marker on dispose', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));
    layer.dispose();

    expect(container.querySelectorAll('[data-asset-marker]')).toHaveLength(0);
  });

  function anchor(position: [number, number, number]) {
    return { position, name: 'WMT:1', criticality: 'A' };
  }

  function setup() {
    container = document.createElement('div');
    document.body.append(container);

    const onSelect = vi.fn();

    return { layer: createMarkerLayer(container, onSelect), onSelect };
  }
});
