import {
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@cognite/aura/components/breadcrumb';
import {
  Topbar,
  TopbarBreadcrumbs,
  TopbarLeft,
} from '@cognite/aura/components/topbar';

import { NAME_PROPERTY_IDENTIFIER } from '../../constants/assets';
import {
  APP_LOGO_ALT_TEXT,
  APP_LOGO_SOURCE,
  APP_NAME,
} from '../../constants/branding';
import { useAssetEquipmentDetails } from '../../hooks/assets/useAssetEquipmentDetails';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetIdentifier } from '../../types/asset';

import { AppLogo } from './AppLogo';

type AssetTopbarProps = {
  selectedAsset?: AssetIdentifier;
};

type SelectedAssetBreadcrumbProps = {
  selectedAsset: AssetIdentifier;
};

function SelectedAssetBreadcrumb({
  selectedAsset,
}: SelectedAssetBreadcrumbProps) {
  const { data } = useAssetEquipmentDetails(selectedAsset);

  const assetName =
    getPropertyValue(data?.asset, NAME_PROPERTY_IDENTIFIER) ??
    selectedAsset.externalId;

  return (
    <BreadcrumbList className="min-w-0 flex-nowrap">
      <BreadcrumbItem className="min-w-0">
        <BreadcrumbPage
          className="truncate font-medium text-base-foreground"
          title={assetName}
        >
          {assetName}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}

export function AssetTopbar({ selectedAsset }: AssetTopbarProps) {
  return (
    <Topbar className="app-topbar sticky top-0 z-20 h-14 gap-4 rounded-none px-4 sm:px-6 lg:px-8">
      <TopbarLeft className="flex-1 gap-4 sm:gap-6">
        <AppLogo
          alt={APP_LOGO_ALT_TEXT}
          fallbackText={APP_NAME}
          source={APP_LOGO_SOURCE}
        />
        {selectedAsset ? (
          <TopbarBreadcrumbs
            aria-label="Breadcrumb"
            className="min-w-0 border-l border-default pl-4 sm:pl-6"
          >
            <SelectedAssetBreadcrumb selectedAsset={selectedAsset} />
          </TopbarBreadcrumbs>
        ) : null}
      </TopbarLeft>
    </Topbar>
  );
}
