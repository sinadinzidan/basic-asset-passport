import { describe, expect, it } from 'vitest';

import { ChartPanel } from '../../../enums/timeSeriesChart';
import { createChartConfiguration, parseConfiguration, serialiseConfiguration, togglePanel } from '../configuration';

describe(parseConfiguration.name, () => {
  it('restores the panel that was serialised', () => {
    const fallback = createChartConfiguration([]);
    const opened = togglePanel(fallback, ChartPanel.ASSISTANT);

    const restored = parseConfiguration(serialiseConfiguration(opened), fallback);

    expect(restored.panel).toBe(ChartPanel.ASSISTANT);
  });

  it('ignores a panel name it does not know', () => {
    const restored = parseConfiguration({ pn: 'NOT_A_PANEL' }, createChartConfiguration([]));

    expect(restored.panel).toBeUndefined();
  });
});
