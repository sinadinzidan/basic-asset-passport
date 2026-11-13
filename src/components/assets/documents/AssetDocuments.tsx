import { AssetDocumentList } from './AssetDocumentList';
import { AssetDocumentUpload } from './AssetDocumentUpload';

export function AssetDocuments() {
  return (
    <div className="flex flex-col gap-5">
      <AssetDocumentUpload />
      <AssetDocumentList />
    </div>
  );
}
