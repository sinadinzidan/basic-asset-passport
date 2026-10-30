import type { ReactNode } from 'react';

import { formatFileMeta } from '../../lib/fileMeta';
import type { FileRecord, FileSelection } from '../../types/asset';
import { FilesCard } from '../general/FilesCard';

export function AssetFilesCard({ assetName, files, notice, footnote, onFileSelect }: {
  assetName: string;
  files: FileRecord[];
  notice?: ReactNode;
  /** Explains a limit that may hide further files, shown under the list. */
  footnote?: string;
  onFileSelect: (file: FileSelection) => void;
}) {
  return (
    <FilesCard
      role="region"
      aria-label={`Files linked to ${assetName}`}
      title="Asset files"
      description="Files linked directly to the asset"
      files={files.map((file) => ({
        key: file.id,
        name: file.name,
        meta: formatFileMeta({ name: file.name, id: file.externalId, revision: file.revision, date: file.date }),
        description: file.description,
        onPreview: () => onFileSelect({ space: file.space, externalId: file.externalId, name: file.name }),
      }))}
      notice={notice}
      footnote={footnote}
      emptyTitle="No files linked to this asset"
      emptyDescription="Files show up here once they are linked to the asset in CDF."
    />
  );
}
