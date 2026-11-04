import { IconTool } from '@tabler/icons-react';

import { NAME_PROPERTY_IDENTIFIER } from '../../constants/assets';
import { getPropertyValue } from '../../lib/assetProperties';
import type { AssetInstanceDetails } from '../../types/asset';

type EquipmentDetailsProps = {
  equipment: AssetInstanceDetails;
};

export function EquipmentDetails({ equipment }: EquipmentDetailsProps) {
  const equipmentName = getPropertyValue(equipment, NAME_PROPERTY_IDENTIFIER);

  return (
    <section className="equipment-card">
      <header className="equipment-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconTool className="size-5" />
          </span>
          <h3 className="font-display min-w-0 break-words text-lg font-semibold tracking-wide">
            {equipmentName ?? equipment.externalId}
          </h3>
        </div>
        <p className="equipment-card__id">
          Equipment ID: {equipment.externalId}
        </p>
      </header>
      <dl className="equipment-card__grid">
        {equipment.properties.map((property) => (
          <div key={property.identifier} className="equipment-card__cell">
            <dt className="equipment-card__label break-words">
              {property.label}
            </dt>
            <dd className="mt-1 min-w-0 break-words whitespace-pre-wrap text-sm font-medium text-base-foreground">
              {property.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
