import type { AssetIdentifier } from '../../../types/asset';

import { AssetNoteAdd } from './AssetNoteAdd';
import { AssetNoteList } from './AssetNoteList';

type AssetNotesProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNotes({ assetIdentifier }: AssetNotesProps) {
  return (
    <div className="flex flex-col gap-5">
      <AssetNoteAdd assetIdentifier={assetIdentifier} />
      <AssetNoteList assetIdentifier={assetIdentifier} />
    </div>
  );
}
