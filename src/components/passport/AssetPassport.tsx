import { IconCpu } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { NO_DESCRIPTION_LABEL } from '../../constants/labels';
import { PassportTab } from '../../enums/passportTab';
import { keyFactsOf } from '../../lib/keyFacts';
import type { FileSelection } from '../../types/asset';
import type { AssetPassportRecord } from '../../types/passport';

import { DocumentsCard } from './DocumentsCard';
import { EquipmentSwitcher } from './EquipmentSwitcher';
import { KeyFactsCard } from './KeyFactsCard';
import { NoEquipmentPassport } from './NoEquipmentPassport';
import { PassportHero } from './PassportHero';
import { PassportLayout } from './PassportLayout';
import { SpecificationsCard } from './SpecificationsCard';

const BADGE_LABELS = ['Class', 'System', 'Facility', 'Area'];

type AssetPassportProps = {
  passports: AssetPassportRecord[];
  assetName: string;
  assetExternalId: string;
  assetFilesCount?: number;
  /** True while the linked files are loading or failed to load, so no document count is shown yet. */
  isDocumentsPending?: boolean;
  documentsFootnote?: string;
  directoryNote: string;
  emptyMessage: string;
  documentsNotice?: ReactNode;
  emptyContent?: ReactNode;
  documentsEmptyMessage?: string;
  onFileSelect: (file: FileSelection) => void;
  activeTab: PassportTab;
  onTabChange: (tab: PassportTab) => void;
  selectedEquipmentId?: string;
  onEquipmentSelect: (equipmentId: string) => void;
};

export function AssetPassport({
  passports,
  assetName,
  assetExternalId,
  assetFilesCount,
  isDocumentsPending = false,
  documentsFootnote,
  directoryNote,
  emptyMessage,
  documentsNotice,
  emptyContent,
  documentsEmptyMessage = 'No documents available',
  onFileSelect,
  activeTab,
  onTabChange,
  selectedEquipmentId,
  onEquipmentSelect,
}: AssetPassportProps) {
  const selected = passports.find((passport) => String(passport.asset.id) === selectedEquipmentId) ?? passports[0];

  if (!selected) {
    return (
      <NoEquipmentPassport assetName={assetName} assetExternalId={assetExternalId} emptyMessage={emptyMessage} directoryNote={directoryNote}
        assetFiles={emptyContent} assetFilesCount={assetFilesCount} activeTab={activeTab} onTabChange={onTabChange} />
    );
  }

  // Without key facts or other equipment there is nothing for a side column, so the tabs take the full width.
  const hasSidebar = keyFactsOf(selected.specifications).length > 0 || passports.length > 1;
  const documentsCount = isDocumentsPending ? undefined : selected.documents.length;

  return (
    <PassportLayout
      hero={(
        <PassportHero
          icon={<IconCpu />}
          eyebrow={`Equipment on ${assetName}`}
          title={selected.asset.name}
          description={selected.asset.description ?? NO_DESCRIPTION_LABEL}
          badges={selected.specifications.filter((specification) => BADGE_LABELS.includes(specification.label))}
          location={selected.location}
          stats={[
            { label: 'Specifications', value: selected.specifications.length },
            { label: 'Documents', value: documentsCount },
            { label: 'Equipment on asset', value: passports.length },
          ]}
        />
      )}
      tabsLabel="Equipment details"
      documentsCount={documentsCount}
      activeTab={activeTab}
      onTabChange={onTabChange}
      directoryNote={directoryNote}
      aside={hasSidebar && (
        <>
          <KeyFactsCard specifications={selected.specifications} />
          {passports.length > 1 && <EquipmentSwitcher passports={passports} selectedId={selected.asset.id} onSelect={(equipmentId) => onEquipmentSelect(String(equipmentId))} />}
        </>
      )}
    >
      {activeTab === PassportTab.OVERVIEW
        ? <SpecificationsCard specifications={selected.specifications} />
        : <DocumentsCard documents={selected.documents} notice={documentsNotice} footnote={documentsFootnote} emptyMessage={documentsEmptyMessage} onFileSelect={onFileSelect} />}
    </PassportLayout>
  );
}
