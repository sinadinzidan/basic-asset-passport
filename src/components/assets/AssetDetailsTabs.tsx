import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';

import { ASSET_TAB_LABELS, AssetTab, isAssetTab } from '../../enums/assetTab';
import { HudShape } from '../../enums/hudShape';
import type { AssetDetailsTabCounts } from '../../hooks/assets/useAssetDetailsTabCounts';
import { useNavigationState } from '../../hooks/general/useNavigationState';
import { formatTabCountBadge } from '../../lib/countBadge';
import type { AssetIdentifier, AssetInstanceDetails } from '../../types/asset';
import type { CountState } from '../../types/countState';
import { HudPanel } from '../general';

import { AssetProperties } from './AssetProperties';
import { AssetDocuments } from './documents';
import { AssetEquipment } from './equipment';
import { AssetNotes } from './notes';
import { AssetTimeseries } from './timeseries';

type AssetDetailsTabsProps = {
  asset: AssetInstanceDetails;
  tabCounts: AssetDetailsTabCounts;
};

export function AssetDetailsTabs({ asset, tabCounts }: AssetDetailsTabsProps) {
  const activeTab = useNavigationState((store) => store.navigationState.activeAssetTab);
  const changeAssetTab = useNavigationState((store) => store.actions.changeAssetTab);

  const assetIdentifier: AssetIdentifier = {
    space: asset.space,
    externalId: asset.externalId,
  };

  function isTabWaitingForCount(tab: AssetTab, count: CountState): boolean {
    return count.isLoading && tab !== activeTab;
  }

  function handleTabValueChange(value: string): void {
    if (isAssetTab(value)) {
      changeAssetTab(value);
    }
  }

  return (
    <HudPanel shape={HudShape.SCREEN} bodyClassName="hud-flush">
      <Tabs className="w-full" value={activeTab} onValueChange={handleTabValueChange}>
        <TabsList aria-label="Asset details" className="hud-tabbar" size="default">
          <TabsTrigger value={AssetTab.PROPERTIES}>
            {ASSET_TAB_LABELS[AssetTab.PROPERTIES]}
          </TabsTrigger>
          <TabsTrigger
            value={AssetTab.EQUIPMENTS}
            badge={formatTabCountBadge(tabCounts.equipment)}
            disabled={isTabWaitingForCount(AssetTab.EQUIPMENTS, tabCounts.equipment)}
          >
            {ASSET_TAB_LABELS[AssetTab.EQUIPMENTS]}
          </TabsTrigger>
          <TabsTrigger
            value={AssetTab.TIMESERIES}
            badge={formatTabCountBadge(tabCounts.timeseries)}
            disabled={isTabWaitingForCount(AssetTab.TIMESERIES, tabCounts.timeseries)}
          >
            {ASSET_TAB_LABELS[AssetTab.TIMESERIES]}
          </TabsTrigger>
          <TabsTrigger
            value={AssetTab.NOTES}
            badge={formatTabCountBadge(tabCounts.notes)}
            disabled={isTabWaitingForCount(AssetTab.NOTES, tabCounts.notes)}
          >
            {ASSET_TAB_LABELS[AssetTab.NOTES]}
          </TabsTrigger>
          <TabsTrigger
            value={AssetTab.DOCUMENTS}
            badge={formatTabCountBadge(tabCounts.documents)}
            disabled={isTabWaitingForCount(AssetTab.DOCUMENTS, tabCounts.documents)}
          >
            {ASSET_TAB_LABELS[AssetTab.DOCUMENTS]}
          </TabsTrigger>
        </TabsList>
        <TabsPanel value={AssetTab.PROPERTIES} className="p-4">
          <div className="data-card">
            <header className="data-card__header">
              <p className="data-card__id">Asset ID: {asset.externalId}</p>
            </header>
            <AssetProperties properties={asset.properties} />
          </div>
        </TabsPanel>
        <TabsPanel value={AssetTab.EQUIPMENTS} className="p-4">
          <AssetEquipment assetIdentifier={assetIdentifier} />
        </TabsPanel>
        <TabsPanel value={AssetTab.TIMESERIES} className="p-4">
          <AssetTimeseries assetIdentifier={assetIdentifier} />
        </TabsPanel>
        <TabsPanel value={AssetTab.NOTES} className="p-4">
          <AssetNotes assetIdentifier={assetIdentifier} />
        </TabsPanel>
        <TabsPanel value={AssetTab.DOCUMENTS} className="p-4">
          <AssetDocuments assetIdentifier={assetIdentifier} />
        </TabsPanel>
      </Tabs>
    </HudPanel>
  );
}
