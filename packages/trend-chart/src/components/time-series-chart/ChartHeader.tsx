import { Input } from '@cognite/aura/components/input';
import { IconPencil } from '@tabler/icons-react';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { ENTER_KEY, ESCAPE_KEY } from '../../constants/keyboardConstants';
import { CHART_TITLE_MAX_LENGTH } from '../../constants/timeSeriesChart';
import { PlainButton } from '../general/PlainButton';

interface ChartHeaderProperties {
  title: string;
  onTitleChange: (title: string) => void;
  status?: ReactNode;
}

export function ChartHeader({ title, onTitleChange, status }: ChartHeaderProperties) {
  const [draft, setDraft] = useState<string | undefined>();
  const isEditing = draft !== undefined;

  const commit = (): void => {
    if (draft !== undefined) onTitleChange(draft);
    setDraft(undefined);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === ENTER_KEY) commit();
    else if (event.key === ESCAPE_KEY) {
      // Escape cancels the edit only: it must not travel on and close the dialog the chart sits in.
      event.stopPropagation();
      setDraft(undefined);
    }
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
        <PlainButton
          className="group min-w-0 gap-1.5"
          aria-label={`Chart title: ${title}. Edit`}
          onClick={() => setDraft(title)}
        >
          <h2 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <IconPencil
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </PlainButton>
      )}
      {status}
    </div>
  );
}
