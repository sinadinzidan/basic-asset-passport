import { Button } from '@cognite/aura/components/button';
import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useId } from 'react';

import { ASSISTANT_PANEL_LABEL, CHART_PANEL_LABELS } from '../../../constants/timeSeriesChart';
import { ChartPanel } from '../../../enums/timeSeriesChart';

interface ChartSidebarProps {
  panel: ChartPanel;
  assistantLabel?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ChartSidebar({ panel, assistantLabel, onClose, children }: ChartSidebarProps) {
  const titleId = useId();
  const title = panel === ChartPanel.ASSISTANT ? (assistantLabel ?? ASSISTANT_PANEL_LABEL) : CHART_PANEL_LABELS[panel];
  return (
    <aside
      role="complementary"
      aria-labelledby={titleId}
      data-panel={panel}
      className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden border-t border-border bg-card-background lg:h-full lg:w-(--chart-sidebar-width) lg:shrink-0 lg:border-l lg:border-t-0"
    >
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
        <h2 id={titleId} className="truncate text-base font-semibold leading-6 tracking-tight text-foreground">
          {title}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label={`Close ${title}`} onClick={onClose}>
          <IconX size={16} aria-hidden />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
