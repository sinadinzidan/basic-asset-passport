import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconBox } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { PassportTab } from '../../enums/passportTab';

import { PassportHero } from './PassportHero';
import { PassportLayout } from './PassportLayout';
import { SpecificationsCard } from './SpecificationsCard';

type NoEquipmentPassportProps = {
  assetName: string;
  assetExternalId: string;
  emptyMessage: string;
  directoryNote: string;
  assetFiles: ReactNode;
  assetFilesCount?: number;
  activeTab: PassportTab;
  onTabChange: (tab: PassportTab) => void;
};

/** The page for an asset with no equipment: the same frame, hero and cards as the equipment page, with their empty states. */
export function NoEquipmentPassport({ assetName, assetExternalId, emptyMessage, directoryNote, assetFiles, assetFilesCount, activeTab, onTabChange }: NoEquipmentPassportProps) {
  return (
    <PassportLayout
      hero={(
        <PassportHero
          icon={<IconBox />}
          title={assetName}
          description={assetExternalId}
          descriptionMono
          status={<Badge variant="gray" background>No equipment linked</Badge>}
          stats={[
            { label: 'Specifications', value: 0 },
            { label: 'Documents', value: assetFilesCount },
            { label: 'Equipment on asset', value: 0 },
          ]}
        />
      )}
      tabsLabel="Asset details"
      documentsCount={assetFilesCount}
      activeTab={activeTab}
      onTabChange={onTabChange}
      directoryNote={directoryNote}
    >
      {activeTab === PassportTab.DOCUMENTS
        ? assetFiles
        : (
          <SpecificationsCard
            specifications={[]}
            empty={{
              title: emptyMessage,
              description: 'Nothing in CDF references this asset as equipment yet. Files linked directly to the asset are in the Documents tab.',
              action: <Button variant="secondary" onClick={() => onTabChange(PassportTab.DOCUMENTS)}>View asset files</Button>,
            }}
          />
        )}
    </PassportLayout>
  );
}
