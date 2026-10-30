import type { ReactNode } from 'react';

import { formatFileMeta } from '../../lib/fileMeta';
import type { FileSelection } from '../../types/asset';
import type { PassportDocument } from '../../types/passport';
import { FilesCard } from '../general/FilesCard';

export function DocumentsCard({ documents, notice, footnote, emptyMessage, onFileSelect }: {
  documents: PassportDocument[];
  notice?: ReactNode;
  /** Explains a limit that may hide further files, shown under the list. */
  footnote?: string;
  emptyMessage: string;
  onFileSelect: (file: FileSelection) => void;
}) {
  return (
    <FilesCard
      title="Documents & certificates"
      description="Files linked to this equipment or its asset"
      files={documents.map((document) => ({
        key: JSON.stringify([document.instanceId.space, document.instanceId.externalId]),
        name: document.title,
        meta: formatFileMeta({ name: document.title, id: document.id, revision: document.revision, date: document.date, origin: document.origin }),
        onPreview: () => onFileSelect({ ...document.instanceId, name: document.title }),
      }))}
      notice={notice}
      footnote={footnote}
      emptyTitle={emptyMessage}
      emptyDescription="Files show up here once they are linked to the equipment or its asset in CDF."
    />
  );
}
