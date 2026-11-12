import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { assert, describe, expect, it, vi } from 'vitest';

import {
  CHART_SIDEBAR_TRANSITION_MS,
  CHART_SIDEBAR_WIDTH_PX,
} from '../../../../constants/timeSeriesChart';
import { ChartPanel } from '../../../../enums/timeSeriesChart';
import { ChartTimersContext } from '../../../../hooks/time-series-chart/useChartTimers';
import type { ChartTimers } from '../../../../hooks/time-series-chart/useChartTimers';
import { ChartSidebar } from '../ChartSidebar';
import { ChartSidebarSlot } from '../ChartSidebarSlot';

describe(ChartSidebar.name, () => {
  it('is a region named after its panel', () => {
    renderSidebar({ panel: ChartPanel.LAYERS });

    expect(screen.getByRole('complementary', { name: 'Layers' })).toHaveAttribute(
      'data-panel',
      ChartPanel.LAYERS,
    );
    expect(screen.getByRole('heading', { name: 'Layers' })).toBeInTheDocument();
  });

  it('shows the content of the panel', () => {
    renderSidebar();

    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('closes with a button that says what it closes', async () => {
    const onClose = vi.fn();
    renderSidebar({ panel: ChartPanel.DATA_PROFILING, onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Close Data profiling' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls the assistant "Assistant" unless the host names it', () => {
    renderSidebar({ panel: ChartPanel.ASSISTANT });

    expect(screen.getByRole('complementary', { name: 'Assistant' })).toBeInTheDocument();
  });

  it('calls the assistant what the host names it', () => {
    renderSidebar({ panel: ChartPanel.ASSISTANT, assistantLabel: 'Dalil AI' });

    expect(screen.getByRole('complementary', { name: 'Dalil AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Dalil AI' })).toBeInTheDocument();
  });

  it('keeps the name of any other panel whatever the assistant is called', () => {
    renderSidebar({ panel: ChartPanel.AXES, assistantLabel: 'Dalil AI' });

    expect(screen.getByRole('complementary', { name: 'Axes' })).toBeInTheDocument();
  });
});

describe(ChartSidebarSlot.name, () => {
  it('puts nothing in the page while no panel is open', () => {
    const { container } = renderSlot({ panel: undefined });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the open panel, at the width of the sidebar', () => {
    const { container } = renderSlot({ panel: ChartPanel.LAYERS });

    expect(screen.getByRole('complementary', { name: 'Layers' })).toHaveTextContent(
      'Body of LAYERS',
    );
    expect(container.firstElementChild).toHaveAttribute('data-state', 'open');
    expect(container.firstElementChild).toHaveStyle({
      '--chart-sidebar-width': `${CHART_SIDEBAR_WIDTH_PX}px`,
    });
  });

  it('replaces the content directly when another panel is opened', () => {
    const { rerenderSlot, manual } = renderSlot({ panel: ChartPanel.LAYERS });

    rerenderSlot({ panel: ChartPanel.AXES });

    expect(screen.getByRole('complementary', { name: 'Axes' })).toHaveTextContent('Body of AXES');
    expect(manual.pendingCount()).toBe(0);
  });

  it('keeps the closing panel on screen, out of reach, while it slides shut', () => {
    const { container, rerenderSlot, manual } = renderSlot({ panel: ChartPanel.LAYERS });

    rerenderSlot({ panel: undefined });

    expect(container.firstElementChild).toHaveAttribute('data-state', 'closing');
    expect(container.firstElementChild).toHaveAttribute('inert');
    expect(container.firstElementChild).toHaveTextContent('Body of LAYERS');
    expect(manual.delays).toEqual([CHART_SIDEBAR_TRANSITION_MS]);
  });

  it('is gone once it has slid shut', () => {
    const { container, rerenderSlot, manual } = renderSlot({ panel: ChartPanel.LAYERS });
    rerenderSlot({ panel: undefined });

    act(() => manual.runAll());

    expect(container).toBeEmptyDOMElement();
  });

  it('stays when a panel is opened again before it has slid shut', () => {
    const { container, rerenderSlot, manual } = renderSlot({ panel: ChartPanel.LAYERS });
    rerenderSlot({ panel: undefined });

    rerenderSlot({ panel: ChartPanel.AXES });

    expect(manual.pendingCount()).toBe(0);
    expect(container.firstElementChild).toHaveAttribute('data-state', 'open');
    expect(container.firstElementChild).not.toHaveAttribute('inert');
  });

  it('closes through the button of the sidebar', async () => {
    const onClose = vi.fn();
    renderSlot({ panel: ChartPanel.LAYERS, onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Close Layers' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

function renderSidebar(overrides: Partial<Parameters<typeof ChartSidebar>[0]> = {}) {
  return render(
    <ChartSidebar panel={ChartPanel.LAYERS} onClose={vi.fn()} {...overrides}>
      <p>Panel content</p>
    </ChartSidebar>,
  );
}

type SlotProperties = Parameters<typeof ChartSidebarSlot>[0];

function renderSlot(overrides: Partial<SlotProperties> = {}) {
  const manual = createManualTimeouts();
  const slot = (properties: Partial<SlotProperties>): ReactNode => (
    <ChartTimersContext.Provider value={manual.timers}>
      <ChartSidebarSlot
        panel={undefined}
        onClose={vi.fn()}
        renderPanel={(panel) => <p>Body of {panel}</p>}
        {...overrides}
        {...properties}
      />
    </ChartTimersContext.Provider>
  );
  const rendered = render(slot({}));
  return {
    ...rendered,
    manual,
    rerenderSlot: (properties: Partial<SlotProperties>): void =>
      rendered.rerender(slot(properties)),
  };
}

/** Timeouts the test runs by hand; the slot sets no interval, so asking for one fails the test. */
function createManualTimeouts() {
  const callbacks = new Map<number, () => void>();
  const delays: number[] = [];
  let nextHandle = 1;
  const timers: ChartTimers = {
    setTimeout: (callback, delayMs) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      delays.push(delayMs);
      return handle;
    },
    clearTimeout: (handle) => {
      callbacks.delete(handle);
    },
    setInterval: () => assert.fail('The sidebar sets no interval'),
    clearInterval: () => assert.fail('The sidebar clears no interval'),
    requestFrame: () => assert.fail('The sidebar asks for no frame'),
    cancelFrame: () => assert.fail('The sidebar cancels no frame'),
  };
  return {
    timers,
    delays,
    pendingCount: (): number => callbacks.size,
    runAll: (): void => {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback());
    },
  };
}
