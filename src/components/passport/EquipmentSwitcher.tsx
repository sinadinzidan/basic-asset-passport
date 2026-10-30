import { Button } from '@cognite/aura/components/button';
import { CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderStart, CardTitle } from '@cognite/aura/components/card';
import { IconCpu } from '@tabler/icons-react';

import { EQUIPMENT_PAGE_SIZE } from '../../constants/assets';
import type { AssetPassportRecord } from '../../types/passport';
import { IconTile } from '../general/IconTile';
import { InitialsAvatar } from '../general/InitialsAvatar';
import { SurfaceCard } from '../general/SurfaceCard';

export function EquipmentSwitcher({ passports, selectedId, onSelect }: {
  passports: AssetPassportRecord[];
  selectedId?: AssetPassportRecord['asset']['id'];
  onSelect: (id: AssetPassportRecord['asset']['id']) => void;
}) {
  return (
    <SurfaceCard>
      <CardHeader>
        <CardHeaderStart><IconTile tone="dusk"><IconCpu /></IconTile></CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h2">Equipment on this asset</CardTitle>
          <CardDescription>
            {passports.length >= EQUIPMENT_PAGE_SIZE ? `First ${passports.length} items linked; more may exist` : `${passports.length} items linked`}
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="items-stretch">
        <nav aria-label="Choose equipment">
          <ul className="-mx-1 max-h-96 space-y-1 overflow-y-auto px-1">
            {passports.map((passport) => {
              const isSelected = passport.asset.id === selectedId;
              return (
                <li key={passport.asset.id}>
                  <Button variant={isSelected ? 'secondary' : 'ghost'} aria-current={isSelected ? 'true' : undefined} title={passport.asset.name}
                    className="h-auto w-full justify-start text-left whitespace-normal" onClick={() => onSelect(passport.asset.id)}>
                    <span className="flex w-full items-center gap-3 py-2">
                      <InitialsAvatar name={passport.asset.name} colorKey={passport.asset.externalId} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium wrap-anywhere">{passport.asset.name}</span>
                        {passport.asset.externalId && <span className={`block font-mono text-xs wrap-anywhere ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{passport.asset.externalId}</span>}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </CardContent>
    </SurfaceCard>
  );
}
