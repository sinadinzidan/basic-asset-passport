import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';

import { MODEL } from '../../config/model';
import { ASSETS_BREADCRUMB_LABEL } from '../../constants/assets';
import { useAssetDetails } from '../../hooks/assets/useAssetDetails';
import { useSelectedAsset } from '../../hooks/assets/useSelectedAsset';
import { useNavigationState } from '../../hooks/general/useNavigationState';
import { getPropertyValue } from '../../lib/assetProperties';

export function SelectedAssetBreadcrumb() {
  const selectedAsset = useSelectedAsset();
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
