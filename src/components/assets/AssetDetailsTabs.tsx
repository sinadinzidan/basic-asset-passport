import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from '@cognite/aura/components/tabs';

import {
  ASSET_EQUIPMENT_TAB_LABELS,
  AssetEquipmentTab,
  isAssetEquipmentTab,
} from '../../enums/assetEquipmentTab';
import type { AssetEquipmentDetails } from '../../types/asset';
import { EmptyStateMessage } from '../general/EmptyStateMessage';
import { HudPanel } from '../general/HudPanel';


import { AssetProperties } from './AssetProperties';
import { AssetDocuments } from './documents/AssetDocuments';
import { EquipmentDetails } from './EquipmentDetails';
import { AssetNotes } from './notes/AssetNotes';
import { AssetTimeseries } from './timeseries/AssetTimeseries';

type AssetDetailsTabsProps = {
  details: AssetEquipmentDetails;
  activeTab: AssetEquipmentTab;
  onTabChange: (tab: AssetEquipmentTab) => void;
};

export function AssetDetailsTabs({
  details,
  activeTab,
  onTabChange,
}: AssetDetailsTabsProps) {
  function handleTabValueChange(value: string): void {
    if (isAssetEquipmentTab(value)) {
      onTabChange(value);
    }
  }

  return (
    <HudPanel bodyClassName="hud-flush">
      <Tabs
        className="w-full"
        value={activeTab}
        onValueChange={handleTabValueChange}
      >
        <TabsList
          aria-label="Asset details"
          className="hud-tabbar"
          size="default"
        >
          <TabsTrigger value={AssetEquipmentTab.PROPERTIES}>
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.PROPERTIES]}
          </TabsTrigger>
          <TabsTrigger
            value={AssetEquipmentTab.EQUIPMENTS}
            badge={details.equipment.length}
          >
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.EQUIPMENTS]}
          </TabsTrigger>
          <TabsTrigger value={AssetEquipmentTab.TIMESERIES}>
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.TIMESERIES]}
          </TabsTrigger>
          <TabsTrigger value={AssetEquipmentTab.NOTES}>
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.NOTES]}
          </TabsTrigger>
          <TabsTrigger value={AssetEquipmentTab.DOCUMENTS}>
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.DOCUMENTS]}
          </TabsTrigger>
        </TabsList>
        <TabsPanel value={AssetEquipmentTab.PROPERTIES} className="p-4">
          <div className="data-card">
            <header className="data-card__header">
              <p className="data-card__id">
                Asset ID: {details.asset.externalId}
              </p>
            </header>
            <AssetProperties properties={details.asset.properties} />
          </div>
        </TabsPanel>
        <TabsPanel value={AssetEquipmentTab.EQUIPMENTS} className="p-4">
          {details.equipment.length === 0 ? (
            <EmptyStateMessage
              title="No equipment linked"
              description="There are no Equipment instances linked to this asset."
            />
          ) : (
            <div className="flex flex-col gap-5">
              {details.equipment.map((equipment) => (
                <EquipmentDetails
                  key={`${equipment.space}:${equipment.externalId}`}
                  equipment={equipment}
                />
              ))}
            </div>
          )}
        </TabsPanel>
        <TabsPanel value={AssetEquipmentTab.TIMESERIES} className="p-4">
          <AssetTimeseries
            assetIdentifier={{
              space: details.asset.space,
              externalId: details.asset.externalId,
            }}
          />
        </TabsPanel>
        <TabsPanel value={AssetEquipmentTab.NOTES} className="p-4">
          <AssetNotes
            assetIdentifier={{
              space: details.asset.space,
              externalId: details.asset.externalId,
            }}
          />
        </TabsPanel>
        <TabsPanel value={AssetEquipmentTab.DOCUMENTS} className="p-4">
          <AssetDocuments
            assetIdentifier={{
              space: details.asset.space,
              externalId: details.asset.externalId,
            }}
          />
        </TabsPanel>
      </Tabs>
    </HudPanel>
  );
}
