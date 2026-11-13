import type { ColumnDef } from '@cognite/aura/data-grid';

import {
  FUNCTIONAL_LOCATION_LABEL,
  NO_DESCRIPTION_LABEL,
  NOT_PROVIDED_LABEL,
  UNNAMED_ASSET_LABEL,
} from '../../constants/labels';
import { getStatusTone } from '../../lib/assetStatus';
import type { AssetListItem } from '../../types/asset';
import { StatusPill } from '../general';

import { CriticalityPill } from './CriticalityPill';

export const ASSET_COLUMNS: ColumnDef<AssetListItem>[] = [
  {
    accessorKey: 'plantName',
    header: 'Plant',
    cell: ({ row }) => row.original.plantName ?? NOT_PROVIDED_LABEL,
  },
  {
    accessorKey: 'externalId',
    header: FUNCTIONAL_LOCATION_LABEL,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.externalId}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Asset name',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name ?? UNNAMED_ASSET_LABEL}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.description ?? NO_DESCRIPTION_LABEL}
      </span>
    ),
  },
  {
    accessorKey: 'flocStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.flocStatus;

      return (
        <div className="flex w-full justify-center">
          <StatusPill status={status} tone={getStatusTone(status)} />
        </div>
      );
    },
  },
  {
    accessorKey: 'abcIndicatorName',
    header: 'Criticality',
    cell: ({ row }) => {
      const criticality = row.original.abcIndicatorName;

      return criticality ? <CriticalityPill criticality={criticality} /> : NOT_PROVIDED_LABEL;
    },
  },
];
