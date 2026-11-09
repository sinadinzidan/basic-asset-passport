import { useAssetNotes } from '../../hooks/notes/useAssetNotes';
import type { AssetIdentifier } from '../../types/asset';
import { EmptyStateMessage } from '../general/EmptyStateMessage';
import { LoadingNotice } from '../general/LoadingNotice';
import { RetryAlert } from '../general/RetryAlert';

import { AssetNoteItem } from './AssetNoteItem';

type AssetNoteListProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNoteList({ assetIdentifier }: AssetNoteListProps) {
  const { data, isError, isFetching, isPending, refetch } =
    useAssetNotes(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }

  if (isPending) {
    return <LoadingNotice className="p-6" message="Loading notes..." />;
  }

  if (isError) {
    return (
      <RetryAlert
        title="Notes could not be loaded"
        description="Check access to the Note view and the notes space, then try again."
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyStateMessage
        title="No notes yet"
        description="Notes added to this asset will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.map((note) => (
        <AssetNoteItem key={`${note.space}:${note.externalId}`} note={note} />
      ))}
    </div>
  );
}
