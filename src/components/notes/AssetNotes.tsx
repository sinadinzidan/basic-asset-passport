import type { AssetIdentifier } from '../../types/asset';

import { AssetNoteForm } from './AssetNoteForm';
import { AssetNoteList } from './AssetNoteList';

type AssetNotesProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNotes({ assetIdentifier }: AssetNotesProps) {
  return (
    <div className="flex flex-col gap-5">
      <AssetNoteForm assetIdentifier={assetIdentifier} />
      <AssetNoteList assetIdentifier={assetIdentifier} />
    </div>
  );
}
