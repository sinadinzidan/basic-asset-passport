import type { ViewDefinition } from '@cognite/sdk';

import {
  ASSET_VIEW_EXTERNAL_ID,
  EQUIPMENT_VIEW_EXTERNAL_ID,
} from '../constants/assets';
import type { NodeInstance } from '../services/assets/viewHelpers';

import { makeNodeInstance, makeViewDefinition } from './cdf';

export const MOCK_VIEW_VERSION = 'v1';
export const MOCK_ASSET_INSTANCE_SPACE = 'mock-asset-instances';
export const MOCK_EQUIPMENT_INSTANCE_SPACE = 'mock-equipment-instances';

const MOCK_ASSET_COUNT = 25;

// Property names follow the views the app reads from CDF, including the
// system, relation and JSON properties the details page leaves out.
export const MOCK_ASSET_VIEW: ViewDefinition = makeViewDefinition(
  ASSET_VIEW_EXTERNAL_ID,
  {
    name: { label: 'Name' },
    description: { label: 'Description' },
    plantName: { label: 'Plant' },
    plantId: { label: 'Plant ID' },
    flocStatus: { label: 'Status' },
    abcIndicatorName: { label: 'Criticality' },
    installationDate: { label: 'Installation date' },
    sourceSystem: { label: 'Source system' },
    functionalLocationId: { label: 'Functional location ID' },
    parent: { label: 'Parent', type: 'direct' },
    metadata: { label: 'Metadata', type: 'json' },
  },
  MOCK_VIEW_VERSION,
);

export const MOCK_EQUIPMENT_VIEW: ViewDefinition = makeViewDefinition(
  EQUIPMENT_VIEW_EXTERNAL_ID,
  {
    name: { label: 'Name' },
    equipmentId: { label: 'Equipment ID' },
    manufacturer: { label: 'Manufacturer' },
    serialNumber: { label: 'Serial number' },
    ratedPowerKw: { label: 'Rated power (kW)' },
    isCritical: { label: 'Critical equipment' },
    sourceSystem: { label: 'Source system' },
    asset: { label: 'Asset', type: 'direct' },
  },
  MOCK_VIEW_VERSION,
);

export const MOCK_VIEWS: ViewDefinition[] = [
  MOCK_ASSET_VIEW,
  MOCK_EQUIPMENT_VIEW,
];

const PLANTS = [
  { name: 'North Plant', id: 'G307' },
  { name: 'South Plant', id: 'G412' },
  { name: 'East Plant', id: 'G518' },
];
const ASSET_TYPES = [
  'Cooling Water Pump',
  'Gas Compressor',
  'Heat Exchanger',
  'Separator Vessel',
  'Flare Knock-out Drum',
];
const STATUSES = [
  'Operating',
  'Operating',
  'Under maintenance',
  'Decommissioned',
];
const CRITICALITIES = [
  'A - High criticality',
  'B - Medium criticality',
  'C - Low criticality',
];
const MANUFACTURERS = [
  'Northwind Industrial',
  'Contoso Rotating',
  'Fabrikam Process',
];

function makeMockAsset(index: number): NodeInstance {
  const number = index + 1;
  const plant = PLANTS[index % PLANTS.length];
  const hasDescription = index % 7 !== 3;

  return makeNodeInstance(
    MOCK_ASSET_VIEW,
    {
      space: MOCK_ASSET_INSTANCE_SPACE,
      externalId: `FLOC-${1000 + number}`,
    },
    {
      name: `${ASSET_TYPES[index % ASSET_TYPES.length]} ${number}`,
      ...(hasDescription
        ? { description: `${plant.name} process unit ${number}` }
        : {}),
      plantName: plant.name,
      plantId: plant.id,
      flocStatus: STATUSES[index % STATUSES.length],
      abcIndicatorName: CRITICALITIES[index % CRITICALITIES.length],
      installationDate: `20${10 + (index % 12)}-0${(index % 9) + 1}-15`,
      sourceSystem: 'MOCK-ERP',
      functionalLocationId: `FL-${number}`,
      metadata: { revision: number },
    },
  );
}

function makeMockEquipment(assetIndex: number): NodeInstance[] {
  // Assets 3, 6, 9... have no equipment so the empty state can be seen.
  const count = (assetIndex + 1) % 3 === 0 ? 0 : (assetIndex % 3) + 1;

  return Array.from({ length: count }, (_, equipmentIndex) => {
    const label = `P-${assetIndex + 1}0${equipmentIndex + 1}`;

    return makeNodeInstance(
      MOCK_EQUIPMENT_VIEW,
      { space: MOCK_EQUIPMENT_INSTANCE_SPACE, externalId: `EQ-${label}` },
      {
        name: `${ASSET_TYPES[assetIndex % ASSET_TYPES.length]} ${label}`,
        equipmentId: label,
        manufacturer: MANUFACTURERS[equipmentIndex % MANUFACTURERS.length],
        serialNumber: `SN-${assetIndex + 1}${equipmentIndex + 1}-2024`,
        ratedPowerKw: 75 * (equipmentIndex + 1),
        isCritical: equipmentIndex === 0,
        sourceSystem: 'MOCK-ERP',
      },
    );
  });
}

export const MOCK_ASSETS: NodeInstance[] = Array.from(
  { length: MOCK_ASSET_COUNT },
  (_, index) => makeMockAsset(index),
);

/** Equipment per asset external ID, standing in for the `asset` relation. */
export const MOCK_EQUIPMENT_BY_ASSET_ID: ReadonlyMap<string, NodeInstance[]> =
  new Map(
    MOCK_ASSETS.map((asset, index) => [
      asset.externalId,
      makeMockEquipment(index),
    ]),
  );
