import { CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderStart, CardTitle } from '@cognite/aura/components/card';
import { IconFiles } from '@tabler/icons-react';
import type { ComponentProps, ReactNode } from 'react';

import { FileRow } from './FileRow';
import { IconTile } from './IconTile';
import { StateMessage } from './StateMessage';
import { SurfaceCard } from './SurfaceCard';

export type FileItem = {
  key: string;
  name: string;
  meta: string;
  description?: string;
  onPreview: () => void;
};

type FilesCardProps = Omit<ComponentProps<typeof SurfaceCard>, 'title'> & {
  title: string;
  description: string;
  files: FileItem[];
  /** A loading or error message, shown under any files already known. */
  notice?: ReactNode;
  /** Explains a limit that may hide further files, shown under the list. */
  footnote?: string;
  emptyTitle: string;
  emptyDescription: string;
};

/** A card of previewable files. Every file list in the app is this one, so they look, wrap and run out of files alike. */
export function FilesCard({ title, description, files, notice, footnote, emptyTitle, emptyDescription, ...cardProps }: FilesCardProps) {
  return (
    <SurfaceCard {...cardProps}>
      <CardHeader>
        <CardHeaderStart><IconTile tone="nordic"><IconFiles /></IconTile></CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="items-stretch">
        {files.length > 0 && (
          <ul className="divide-y divide-border">
            {files.map((file) => (
              <li key={file.key}><FileRow name={file.name} meta={file.meta} description={file.description} onPreview={file.onPreview} /></li>
            ))}
          </ul>
        )}
        {footnote && files.length > 0 && <p role="note" className="text-xs text-muted-foreground">{footnote}</p>}
        {notice ?? (files.length === 0 && <StateMessage compact type="no-results" title={emptyTitle} description={emptyDescription} />)}
      </CardContent>
    </SurfaceCard>
  );
}
