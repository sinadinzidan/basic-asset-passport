import { Input } from '@cognite/aura/components/input';
import { IconPencil } from '@tabler/icons-react';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { CHART_TITLE_MAX_LENGTH } from '../../constants/timeSeriesChart';

interface ChartHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  status?: ReactNode;
}

export function ChartHeader({ title, onTitleChange, status }: ChartHeaderProps) {
  const [draft, setDraft] = useState<string | undefined>();
  const isEditing = draft !== undefined;

  const commit = (): void => {
    if (draft !== undefined) onTitleChange(draft);
    setDraft(undefined);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') commit();
    else if (event.key === 'Escape') setDraft(undefined);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {isEditing ? (
        <Input
          aria-label="Chart title"
          autoFocus
          className="h-8 w-72 max-w-full text-base font-semibold"
          maxLength={CHART_TITLE_MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          type="button"
          className="group inline-flex min-w-0 items-center gap-1.5 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={`Chart title: ${title}. Edit`}
          onClick={() => setDraft(title)}
        >
          <h2 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <IconPencil
            size={14}
            aria-hidden
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </button>
      )}
      {status}
    </div>
  );
}
