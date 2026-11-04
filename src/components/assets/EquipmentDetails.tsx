import { IconTool } from '@tabler/icons-react';

import { NAME_PROPERTY_IDENTIFIER } from '../../constants/assets';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetInstanceDetails } from '../../types/asset';

import { AssetProperties } from './AssetProperties';

type EquipmentDetailsProps = {
  equipment: AssetInstanceDetails;
};

export function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  const equipmentName = getPropertyValue(equipment, NAME_PROPERTY_IDENTIFIER);

  return (
    <section className="py-6 first:pt-0 last:pb-0">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconTool className="size-5" />
          </span>
          <h3 className="min-w-0 break-words text-lg font-semibold">
            {equipmentName ?? equipment.externalId}
          </h3>
        </div>
        <p className="rounded-full border border-default bg-muted-background px-3 py-1 font-mono text-xs text-muted-foreground">
          Equipment ID: {equipment.externalId}
        </p>
      </header>
      <AssetProperties properties={equipment.properties} />
    </section>
  );
}
