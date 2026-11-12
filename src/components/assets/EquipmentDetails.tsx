import { IconTool } from '@tabler/icons-react';

import { MODEL } from '../../config/model';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetInstanceDetails } from '../../types/asset';

import { AssetProperties } from './AssetProperties';

type EquipmentDetailsProps = {
  equipment: AssetInstanceDetails;
};

export function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  const equipmentName = getPropertyValue(equipment, MODEL.properties.asset.name);

  return (
    <section className="data-card">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconTool className="size-5" />
          </span>
          <h3 className="font-display min-w-0 break-words text-lg font-semibold tracking-wide">
            {equipmentName ?? equipment.externalId}
          </h3>
        </div>
        <p className="data-card__id">Equipment ID: {equipment.externalId}</p>
      </header>
      <AssetProperties properties={equipment.properties} />
    </section>
  );
}
