import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useActiveShortcutMark } from '../useActiveShortcutMark';

describe(useActiveShortcutMark.name, () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marks the shortcut button that carries the label', () => {
    addPanel(['Last 7 days', 'Last 6 months']);

    renderHook(() => useActiveShortcutMark('Last 6 months'));

    expect(isMarked('Last 6 months')).toBe(true);
    expect(isMarked('Last 7 days')).toBe(false);
  });

  it('marks a panel that opens after the hook was mounted', async () => {
    renderHook(() => useActiveShortcutMark('Last 6 months'));

    addPanel(['Last 7 days', 'Last 6 months']);

    await waitFor(() => expect(isMarked('Last 6 months')).toBe(true));
  });

  it('moves the mark when the label changes', () => {
    addPanel(['Last 7 days', 'Last 6 months']);
    const { rerender } = renderHook(({ label }) => useActiveShortcutMark(label), {
      initialProps: { label: 'Last 6 months' },
    });

    rerender({ label: 'Last 7 days' });

    expect(isMarked('Last 7 days')).toBe(true);
    expect(isMarked('Last 6 months')).toBe(false);
  });

  it('marks nothing when no shortcut is active', () => {
    addPanel(['Last 7 days']);

    renderHook(() => useActiveShortcutMark(undefined));

    expect(isMarked('Last 7 days')).toBe(false);
  });

  it('leaves buttons outside a shortcuts panel alone', () => {
    const button = document.createElement('button');
    button.dataset.slot = 'button';
    button.textContent = 'Last 6 months';
    document.body.append(button);

    renderHook(() => useActiveShortcutMark('Last 6 months'));

    expect(button.hasAttribute('data-active')).toBe(false);
  });
});

function addPanel(labels: string[]): void {
  const panel = document.createElement('div');
  panel.dataset.slot = 'shortcuts-panel';
  for (const label of labels) {
    const button = document.createElement('button');
    button.dataset.slot = 'button';
    button.textContent = label;
    panel.append(button);
  }
  document.body.append(panel);
}

function isMarked(label: string): boolean {
  const button = [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label,
  );
  return button?.hasAttribute('data-active') ?? false;
}
