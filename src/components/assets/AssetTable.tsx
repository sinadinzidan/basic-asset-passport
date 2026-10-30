import { Badge } from '@cognite/aura/components/badge';
import { IconChevronRight } from '@tabler/icons-react';

import { EMPTY_VALUE_LABEL, NO_DESCRIPTION_LABEL, NO_EXTERNAL_ID_LABEL } from '../../constants/labels';
import { toAssetSelection as toSelection } from '../../lib/assetSelection';
import type { AssetRecord, AssetSelection } from '../../types/asset';
import { DataTable } from '../general/DataTable';
import type { DataTableColumn } from '../general/DataTable';
import { InitialsAvatar } from '../general/InitialsAvatar';

import { AssetName } from './AssetName';


function buildColumns(onAssetSelect?: (asset: AssetSelection) => void): DataTableColumn<AssetRecord>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      isRowHeader: true,
      headerClassName: 'w-1/3 min-w-64',
      cell: (asset) => {
        const selection = toSelection(asset);
        return (
          <div className="flex items-center gap-3">
            <InitialsAvatar name={asset.name} colorKey={asset.externalId} />
            <div className="min-w-0 flex-1">
              <AssetName name={asset.name} onOpen={selection && onAssetSelect ? () => onAssetSelect(selection) : undefined} />
              <span className="block font-mono text-xs text-muted-foreground wrap-anywhere">{asset.externalId ?? NO_EXTERNAL_ID_LABEL}</span>
              {asset.area && <span className="block text-xs text-muted-foreground wrap-anywhere md:hidden">{asset.area}</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'area',
      header: 'Plant area',
      hideBelow: 'md',
      headerClassName: 'whitespace-nowrap',
      cell: (asset) => asset.area
        ? <Badge variant="gray" background className="max-w-48 truncate" title={asset.area}>{asset.area}</Badge>
        : <><span aria-hidden="true" className="text-muted-foreground">{EMPTY_VALUE_LABEL}</span><span className="sr-only">Not provided</span></>,
    },
    {
      id: 'description',
      header: 'Description',
      hideBelow: 'lg',
      className: 'text-muted-foreground',
      cell: (asset) => <span className="line-clamp-2 max-w-prose wrap-anywhere" title={asset.description}>{asset.description || NO_DESCRIPTION_LABEL}</span>,
    },
    {
      id: 'open',
      header: 'Open',
      hideHeader: true,
      headerClassName: 'w-12',
      className: 'text-right text-muted-foreground',
      cell: () => <IconChevronRight aria-hidden className="inline transition-transform motion-safe:group-hover:translate-x-0.5" />,
    },
  ];
}

export function AssetTable({ assets, onAssetSelect }: {
  assets: AssetRecord[];
  onAssetSelect?: (asset: AssetSelection) => void;
}) {
  return (
    <DataTable
      caption="Assets with identifiers, plant areas, and descriptions"
      columns={buildColumns(onAssetSelect)}
      rows={assets}
      getRowId={(asset) => String(asset.id)}
      isRowClickable={(asset) => toSelection(asset) !== undefined}
      onRowClick={onAssetSelect && ((asset) => {
        const selection = toSelection(asset);
        if (selection) onAssetSelect(selection);
      })}
    />
  );
}
