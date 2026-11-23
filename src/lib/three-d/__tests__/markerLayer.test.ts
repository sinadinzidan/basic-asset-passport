import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';

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

  it('leaves the pointer alone', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));

    expect(container.querySelector<HTMLElement>('[data-asset-marker]')?.style.pointerEvents).toBe(
      'none',
    );
  });

  it('removes every marker on dispose', () => {
    const { layer } = setup();

    layer.setAnchors(new Map([[0, anchor([0, 0, 0])]]));
    layer.dispose();

    expect(container.querySelectorAll('[data-asset-marker]')).toHaveLength(0);
  });

  function anchor(position: [number, number, number]) {
    return { position, name: 'WMT:1' };
  }

  function setup() {
    container = document.createElement('div');
    document.body.append(container);

    return { layer: createMarkerLayer(container) };
  }
});
