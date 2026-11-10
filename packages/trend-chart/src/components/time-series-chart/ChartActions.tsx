import { Button } from '@cognite/aura/components/button';
import { IconPlus } from '@tabler/icons-react';

interface ChartActionsProps {
  onAddData: () => void;
}

export function ChartActions({ onAddData }: ChartActionsProps) {
  return (
    <div role="group" aria-label="Chart actions" className="flex flex-wrap items-center gap-1.5">
      <Button type="button" size="sm" className="h-8" onClick={onAddData}>
        <IconPlus size={16} aria-hidden />
        Add data
      </Button>
    </div>
  );
}
