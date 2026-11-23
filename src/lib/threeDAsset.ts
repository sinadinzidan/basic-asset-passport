import { MODEL } from '../config/model';
import { THREE_D_PLANT_NAME } from '../constants/threeD';
import type { AssetInstanceDetails } from '../types/asset';

import { getPropertyValue } from './assetProperties';

export function hasThreeDModel(asset: AssetInstanceDetails | undefined): boolean {
  const plantName = getPropertyValue(asset, MODEL.properties.asset.plantName);

  return plantName?.trim().toLowerCase() === THREE_D_PLANT_NAME.toLowerCase();
}
