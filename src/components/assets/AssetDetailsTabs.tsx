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
import { GlassCard } from '../general/GlassCard';

import { AssetProperties } from './AssetProperties';
import { EquipmentDetails } from './EquipmentDetails';

type AssetDetailsTabsProps = {
  details: AssetEquipmentDetails;
  activeTab: AssetEquipmentTab;
  onTabChange: (tab: AssetEquipmentTab) => void;
};

const EQUIPMENT_TAB_BADGE_CLASS_NAME = [
  '[&_[data-slot=badge]]:h-5',
  '[&_[data-slot=badge]]:min-w-5',
  '[&_[data-slot=badge]]:rounded-full',
  '[&_[data-slot=badge]]:border',
  '[&_[data-slot=badge]]:border-primary-background',
  '[&_[data-slot=badge]]:bg-primary-background',
  '[&_[data-slot=badge]]:px-1.5',
  '[&_[data-slot=badge]]:font-mono',
  '[&_[data-slot=badge]]:text-foreground-on-primary!',
].join(' ');

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
    <GlassCard className="page-enter overflow-hidden">
      <Tabs
        className="w-full [&_[data-slot='tabs-indicator']]:bg-brand"
        value={activeTab}
        onValueChange={handleTabValueChange}
      >
        <TabsList
          aria-label="Asset details"
          className="w-full max-w-full gap-6 border-b border-default bg-muted-background/50 px-5 pt-3 sm:px-6"
          size="default"
        >
          <TabsTrigger
            className="data-active:text-brand-strong"
            value={AssetEquipmentTab.PROPERTIES}
          >
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.PROPERTIES]}
          </TabsTrigger>
          <TabsTrigger
            className={`data-active:text-brand-strong ${EQUIPMENT_TAB_BADGE_CLASS_NAME}`}
            value={AssetEquipmentTab.EQUIPMENTS}
            badge={details.equipment.length}
          >
            {ASSET_EQUIPMENT_TAB_LABELS[AssetEquipmentTab.EQUIPMENTS]}
          </TabsTrigger>
        </TabsList>
        <TabsPanel value={AssetEquipmentTab.PROPERTIES} className="p-5 sm:p-6">
          <AssetProperties properties={details.asset.properties} />
        </TabsPanel>
        <TabsPanel value={AssetEquipmentTab.EQUIPMENTS} className="p-5 sm:p-6">
          {details.equipment.length === 0 ? (
            <EmptyStateMessage
              title="No equipment linked"
              description="There are no Equipment instances linked to this asset."
            />
          ) : (
            <div className="flex flex-col divide-y divide-default">
              {details.equipment.map((equipment) => (
                <EquipmentDetails
                  key={`${equipment.space}:${equipment.externalId}`}
                  equipment={equipment}
                />
              ))}
            </div>
          )}
        </TabsPanel>
      </Tabs>
    </GlassCard>
  );
}
