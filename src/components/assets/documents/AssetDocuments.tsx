import type { AssetIdentifier } from '../../../types/asset';

import { AssetDocumentList } from './AssetDocumentList';
import { AssetDocumentUpload } from './AssetDocumentUpload';

type AssetDocumentsProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDocuments({ assetIdentifier }: AssetDocumentsProps) {
  return (
    <div className="flex flex-col gap-5">
      <AssetDocumentUpload assetIdentifier={assetIdentifier} />
      <AssetDocumentList assetIdentifier={assetIdentifier} />
    </div>
  );
}
