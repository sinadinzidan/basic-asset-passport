import { Skeleton } from '@cognite/aura/components/skeleton';

import { EQUIPMENT_VIEW, RELATED_FILES_LIMIT } from '../../constants/assets';
import type { PassportTab } from '../../enums/passportTab';
import { useEquipmentPageViewModel } from '../../hooks/assets/useEquipmentPageViewModel';
import type { AssetSelection, FileSelection } from '../../types/asset';
import { LoadingNotice } from '../general/LoadingNotice';
import { PageHeader } from '../general/PageHeader';
import { RetryAlert } from '../general/RetryAlert';
import { AssetPassport } from '../passport/AssetPassport';

import { AssetFilesCard } from './AssetFilesCard';
import { FilePreviewDialog } from './FilePreviewDialog';

type EquipmentPageProps = {
  selectedAsset: AssetSelection;
  selectedFile?: FileSelection;
  onFileSelect: (file: FileSelection | undefined) => void;
  passportTab: PassportTab;
  onPassportTabChange: (tab: PassportTab) => void;
  selectedEquipmentId?: string;
  onEquipmentSelect: (equipmentId: string) => void;
};

export function EquipmentPage({ selectedAsset, selectedFile, onFileSelect, passportTab, onPassportTabChange, selectedEquipmentId, onEquipmentSelect }: EquipmentPageProps) {
  const { client, passports, assetFiles, isEquipmentFetching, equipmentErrorMessage, isFilesLoading, isFilesFetching, filesErrorMessage, retryEquipment, retryFiles } = useEquipmentPageViewModel(selectedAsset);

  const documentsNotice = filesErrorMessage ? (
    <RetryAlert message={`Failed to load files: ${filesErrorMessage}`} onRetry={retryFiles} isBusy={isFilesFetching} />
  ) : isFilesLoading ? (
    <LoadingNotice label="Loading files" size="small" />
  ) : undefined;

  const filesFootnote = assetFiles.length >= RELATED_FILES_LIMIT
    ? `Showing the first ${RELATED_FILES_LIMIT} files linked to the asset; more may exist.`
    : undefined;

  if (!passports) {
    return (
      <section aria-label={`Equipment under ${selectedAsset.name}`} className="space-y-6">
        <PageHeader title={`Equipment under ${selectedAsset.name}`} description={selectedAsset.externalId} />
        {equipmentErrorMessage ? (
          <RetryAlert message={`Failed to load equipment: ${equipmentErrorMessage}`} onRetry={retryEquipment} isBusy={isEquipmentFetching} />
        ) : (
          <div role="status" aria-label="Loading equipment" className="space-y-3">
            <span className="sr-only">Loading equipment…</span>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <AssetPassport
        activeTab={passportTab}
        onTabChange={onPassportTabChange}
        selectedEquipmentId={selectedEquipmentId}
        onEquipmentSelect={onEquipmentSelect}
        passports={passports}
        assetName={selectedAsset.name}
        assetExternalId={selectedAsset.externalId}
        assetFilesCount={isFilesLoading || filesErrorMessage ? undefined : assetFiles.length}
        isDocumentsPending={isFilesLoading || Boolean(filesErrorMessage)}
        documentsFootnote={filesFootnote}
        directoryNote={`Names, tags, specifications and files come from ${EQUIPMENT_VIEW.space}.`}
        emptyMessage="No equipment linked to this asset"
        documentsNotice={documentsNotice}
        emptyContent={<AssetFilesCard assetName={selectedAsset.name} files={assetFiles} notice={documentsNotice} footnote={filesFootnote} onFileSelect={onFileSelect} />}
        documentsEmptyMessage="No files linked to this equipment or its asset"
        onFileSelect={onFileSelect}
      />
      {selectedFile && (
        <FilePreviewDialog
          key={JSON.stringify([selectedFile.space, selectedFile.externalId])}
          file={selectedFile}
          client={client}
          onClose={() => onFileSelect(undefined)}
        />
      )}
    </>
  );
}
