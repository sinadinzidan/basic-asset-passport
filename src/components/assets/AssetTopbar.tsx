import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import {
  Topbar,
  TopbarBreadcrumbs,
  TopbarLeft,
  TopbarRight,
} from '@cognite/aura/components/topbar';

import { MODEL } from '../../config/model';
import { ASSETS_BREADCRUMB_LABEL } from '../../constants/assets';
import { APP_LOGO_ALT_TEXT, APP_LOGO_SOURCE, APP_NAME } from '../../constants/branding';
import { useAssetDetails } from '../../hooks/assets/useAssetDetails';
import { useNavigationState } from '../../hooks/general/useNavigationState';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetIdentifier } from '../../types/asset';
import { ThemeModeToggle } from '../general';

import { AppLogo } from './AppLogo';

type SelectedAssetBreadcrumbProps = {
  selectedAsset: AssetIdentifier;
};

function SelectedAssetBreadcrumb({ selectedAsset }: SelectedAssetBreadcrumbProps) {
  const clearSelectedAsset = useNavigationState((store) => store.actions.clearSelectedAsset);
  const { data } = useAssetDetails(selectedAsset);

  const assetName = getPropertyValue(data, MODEL.properties.asset.name) ?? selectedAsset.externalId;

  return (
    <BreadcrumbList className="min-w-0 flex-nowrap">
      <BreadcrumbItem>
        <BreadcrumbLink render={<button type="button" onClick={clearSelectedAsset} />}>
          {ASSETS_BREADCRUMB_LABEL}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem className="min-w-0">
        <BreadcrumbPage className="truncate font-medium text-base-foreground" title={assetName}>
          {assetName}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}

export function AssetTopbar() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  return (
    <Topbar className="dark app-topbar sticky top-0 z-20 h-14 gap-4 rounded-none px-4 sm:px-6 lg:px-8">
      <TopbarLeft className="flex-1 gap-4 sm:gap-6">
        <AppLogo alt={APP_LOGO_ALT_TEXT} fallbackText={APP_NAME} source={APP_LOGO_SOURCE} />
        {selectedAsset ? (
          <TopbarBreadcrumbs
            aria-label="Breadcrumb"
            className="min-w-0 border-l border-default pl-4 sm:pl-6"
          >
            <SelectedAssetBreadcrumb selectedAsset={selectedAsset} />
          </TopbarBreadcrumbs>
        ) : null}
      </TopbarLeft>
      <TopbarRight className="flex-none">
        <ThemeModeToggle />
      </TopbarRight>
    </Topbar>
  );
}
