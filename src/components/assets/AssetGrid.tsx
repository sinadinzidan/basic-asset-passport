import { Badge } from '@cognite/aura/components/badge';
import { CardContent } from '@cognite/aura/components/card';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';

import { NO_DESCRIPTION_LABEL, NO_EXTERNAL_ID_LABEL } from '../../constants/labels';
import { toAssetSelection } from '../../lib/assetSelection';
import { revealMotion } from '../../lib/motion';
import type { AssetRecord, AssetSelection } from '../../types/asset';
import { InitialsAvatar } from '../general/InitialsAvatar';
import { SurfaceCard } from '../general/SurfaceCard';

import { AssetName } from './AssetName';


export function AssetGrid({ assets, onAssetSelect }: {
  assets: AssetRecord[];
  onAssetSelect?: (asset: AssetSelection) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <ul aria-label="Assets" className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4 p-4">
      {assets.map((asset, index) => {
        const selection = toAssetSelection(asset);
        const open = selection && onAssetSelect ? () => onAssetSelect(selection) : undefined;
        return (
          <m.li key={asset.id} {...revealMotion(index, reduceMotion)}>
            <SurfaceCard className={open ? 'h-full cursor-pointer transition-shadow hover:border-border-emphasized hover:shadow-md' : 'h-full'} onClick={open}>
              <CardContent className="items-stretch gap-3">
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={asset.name} colorKey={asset.externalId} />
                  <div className="min-w-0 flex-1">
                    <AssetName name={asset.name} onOpen={open} />
                    <span className="block font-mono text-xs text-muted-foreground wrap-anywhere">{asset.externalId ?? NO_EXTERNAL_ID_LABEL}</span>
                  </div>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground wrap-anywhere" title={asset.description}>{asset.description || NO_DESCRIPTION_LABEL}</p>
                {asset.area && <Badge variant="gray" background className="max-w-full self-start truncate" title={asset.area}>{asset.area}</Badge>}
              </CardContent>
            </SurfaceCard>
          </m.li>
        );
      })}
    </ul>
  );
}
