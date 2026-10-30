import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconFileText } from '@tabler/icons-react';

import { repeatsName } from '../../lib/fileMeta';

import { IconTile } from './IconTile';

/**
 * A file in a list: its name and details, as one button that opens the preview. The button takes its accessible name from
 * its visible text, so it always contains what sighted users read (a separate aria-label would not).
 */
export function FileRow({ name, meta, description, onPreview }: {
  name: string;
  meta: string;
  description?: string;
  onPreview: () => void;
}) {
  return (
    <Button variant="ghost" className="h-auto w-full justify-start text-left whitespace-normal" onClick={onPreview}>
      <span className="flex w-full items-center gap-3 py-3">
        <IconTile tone="fjord"><IconFileText /></IconTile>
        <span className="min-w-0 flex-1">
          <strong className="block font-medium wrap-anywhere">{name}</strong>
          <small className="block text-xs text-muted-foreground wrap-anywhere">{meta}</small>
          {description && !repeatsName(description, name) && (
            <span className="block text-sm text-muted-foreground wrap-anywhere">{description}</span>
          )}
        </span>
        <Badge variant="secondary" className="shrink-0">Preview</Badge>
      </span>
    </Button>
  );
}
