import { IconFile } from '@tabler/icons-react';

import { StatusPill } from '../../general/StatusPill';

type AssetDocumentUploadingItemProps = {
  name: string;
};

/** A file on its way to CDF: it takes the place of the document until the real one is listed. */
export function AssetDocumentUploadingItem({
  name,
}: AssetDocumentUploadingItemProps) {
  return (
    <article aria-label={`Uploading ${name}`} className="data-card">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="icon-chip size-12">
            <IconFile className="size-6" />
          </span>
          <div className="min-w-0 space-y-2">
            <h3 className="font-display min-w-0 break-words text-lg font-semibold leading-tight tracking-wide">
              {name}
            </h3>
            <StatusPill status="Uploading..." />
          </div>
        </div>
      </header>
    </article>
  );
}
