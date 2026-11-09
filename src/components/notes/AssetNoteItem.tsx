import { IconNote } from '@tabler/icons-react';

import { UNKNOWN_AUTHOR_LABEL } from '../../constants/notes';
import { formatNoteDate } from '../../lib/formatNoteDate';
import type { AssetNote } from '../../types/note';

type AssetNoteItemProps = {
  note: AssetNote;
};

export function AssetNoteItem({ note }: AssetNoteItemProps) {
  return (
    <article className="data-card">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconNote className="size-5" />
          </span>
          <h3 className="font-display min-w-0 break-words text-lg font-semibold tracking-wide">
            {note.title}
          </h3>
        </div>
        <p className="data-card__id">
          {note.author ?? UNKNOWN_AUTHOR_LABEL} · {formatNoteDate(note.createdTime)}
        </p>
      </header>
      {note.body ? (
        <p className="whitespace-pre-wrap break-words p-4">{note.body}</p>
      ) : null}
    </article>
  );
}
