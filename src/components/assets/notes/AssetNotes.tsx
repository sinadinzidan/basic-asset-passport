import { AssetNoteAdd } from './AssetNoteAdd';
import { AssetNoteList } from './AssetNoteList';

export function AssetNotes() {
  return (
    <div className="flex flex-col gap-5">
      <AssetNoteAdd />
      <AssetNoteList />
    </div>
  );
}
