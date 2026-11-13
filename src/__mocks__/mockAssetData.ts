import type { DataModel, ViewDefinition } from '@cognite/sdk';

import { MODEL } from '../config/model';
import { TestPropertyType } from '../enums/testPropertyType';
import type { NodeInstance } from '../services/assets/viewHelpers';

import { makeNodeInstance, makeViewDefinition } from './cdf';

export const MOCK_VIEW_VERSION = 'v1';
const MOCK_RMDM_VIEW_SPACE = 'sp-dm-idi-rmdm';

export const MOCK_ASSET_INSTANCE_SPACE = 'mock-asset-instances';
const MOCK_EQUIPMENT_INSTANCE_SPACE = 'mock-equipment-instances';

const MOCK_ASSET_COUNT = 25;

const MOCK_ASSET_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.views.asset,
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
    parent: { label: 'Parent', type: TestPropertyType.DIRECT },
    metadata: { label: 'Metadata', type: TestPropertyType.JSON },
  },
  MOCK_VIEW_VERSION,
  MOCK_RMDM_VIEW_SPACE,
);

const MOCK_EQUIPMENT_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.views.equipment,
  {
    name: { label: 'Name' },
    equipmentId: { label: 'Equipment ID' },
    manufacturer: { label: 'Manufacturer' },
    serialNumber: { label: 'Serial number' },
    ratedPowerKw: { label: 'Rated power (kW)' },
    isCritical: { label: 'Critical equipment' },
    sourceSystem: { label: 'Source system' },
    asset: { label: 'Asset', type: TestPropertyType.DIRECT },
  },
  MOCK_VIEW_VERSION,
  MOCK_RMDM_VIEW_SPACE,
);

const MOCK_NOTE_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.views.note,
  {
    title: { label: 'Title' },
    body: { label: 'Note' },
    author: { label: 'Author' },
    authorId: { label: 'Author ID' },
    asset: { label: 'Asset', type: TestPropertyType.DIRECT },
  },
  MOCK_VIEW_VERSION,
  MODEL.space,
);

export const MOCK_DOCUMENT_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.views.document,
  {
    name: { label: 'Name' },
    mimeType: { label: 'File type' },
    isUploaded: { label: 'Upload status' },
    uploadedTime: { label: 'Uploaded time' },
    asset: { label: 'Asset', type: TestPropertyType.DIRECT },
  },
  MOCK_VIEW_VERSION,
  MODEL.space,
);

const MOCK_TIMESERIES_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.views.timeseries,
  {
    name: { label: 'Name' },
    description: { label: 'Description' },
    type: { label: 'Type' },
    isStep: { label: 'Step series' },
    tag: { label: 'Tag' },
    engunits: { label: 'Engineering Units' },
    plantName: { label: 'Plant Name' },
    unitName: { label: 'Unit Name' },
    typicalvalue: { label: 'Typical Value' },
    oweLimitMax: { label: 'OWE Limit Max' },
    oweLimitMin: { label: 'OWE Limit Min' },
    tripLimitMax: { label: 'Trip Limit Max' },
    tripLimitMin: { label: 'Trip Limit Min' },

    compdev: { label: 'Compression Deviation' },
    assets: { label: 'Assets', type: TestPropertyType.DIRECT },
  },
  MOCK_VIEW_VERSION,
  MOCK_RMDM_VIEW_SPACE,
);

const MOCK_FILES_VIEW: ViewDefinition = makeViewDefinition(
  MODEL.filesView.externalId,
  {
    name: { label: 'Name' },
    mimeType: { label: 'File type' },
    isUploaded: { label: 'Upload status' },
    uploadedTime: { label: 'Uploaded time' },
    assets: { label: 'Assets', type: TestPropertyType.DIRECT },
  },
  MOCK_VIEW_VERSION,
  MOCK_RMDM_VIEW_SPACE,
);

const MOCK_VIEWS: ViewDefinition[] = [
  MOCK_ASSET_VIEW,
  MOCK_EQUIPMENT_VIEW,
  MOCK_TIMESERIES_VIEW,
  MOCK_NOTE_VIEW,
  MOCK_DOCUMENT_VIEW,
];

export const MOCK_DATA_MODEL: DataModel = {
  space: MODEL.space,
  externalId: MODEL.externalId,
  version: MODEL.version,
  isGlobal: false,
  createdTime: 0,
  lastUpdatedTime: 0,
  views: MOCK_VIEWS,
};

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

const STATUSES = ['Operating', 'Operating', 'Under maintenance', 'Decommissioned'];
const CRITICALITIES = ['A - High criticality', 'B - Medium criticality', 'C - Low criticality'];
const MANUFACTURERS = ['Northwind Industrial', 'Contoso Rotating', 'Fabrikam Process'];

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
      ...(hasDescription ? { description: `${plant.name} process unit ${number}` } : {}),
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
  const count = (assetIndex + 1) % 3 === 0 ? 0 : (assetIndex % 3) + 1;

  return Array.from({ length: count }, (_item, equipmentIndex) => {
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
  (_item, index) => makeMockAsset(index),
);

export const MOCK_EQUIPMENT_BY_ASSET_ID: ReadonlyMap<string, NodeInstance[]> = new Map(
  MOCK_ASSETS.map((asset, index) => [asset.externalId, makeMockEquipment(index)]),
);

const HOUR_MS = 3_600_000;

function makeMockNote(
  externalId: string,
  assetIndex: number,
  hoursAgo: number,
  properties: { title: string; body?: string; author?: string },
): NodeInstance {
  return {
    ...makeNodeInstance(
      MOCK_NOTE_VIEW,
      { space: MODEL.instanceSpace, externalId },
      {
        ...properties,
        asset: {
          space: MOCK_ASSET_INSTANCE_SPACE,
          externalId: MOCK_ASSETS[assetIndex].externalId,
        },
      },
    ),
    createdTime: Date.now() - hoursAgo * HOUR_MS,
  };
}

export const MOCK_NOTES: readonly NodeInstance[] = [
  makeMockNote('note-mock-1', 0, 72, {
    title: 'Seal inspection',
    body: 'Mechanical seal checked during the weekly round, no leaks found.',
    author: 'Sam Operator',
  }),
  makeMockNote('note-mock-2', 0, 5, {
    title: 'Vibration above normal',
    body: 'Bearing vibration slightly high on the drive end. Re-check after the next shutdown.',
    author: 'Mock User',
  }),
  makeMockNote('note-mock-3', 1, 24, { title: 'Valve actuator replaced' }),
];

function makeMockDocument(
  externalId: string,
  assetIndex: number,
  hoursAgo: number,
  properties: { name: string; mimeType: string; isUploaded?: boolean },
): NodeInstance {
  const createdTime = Date.now() - hoursAgo * HOUR_MS;
  const { isUploaded = true, ...rest } = properties;

  return {
    ...makeNodeInstance(
      MOCK_DOCUMENT_VIEW,
      { space: MODEL.instanceSpace, externalId },
      {
        ...rest,
        isUploaded,
        ...(isUploaded ? { uploadedTime: new Date(createdTime).toISOString() } : {}),
        asset: {
          space: MOCK_ASSET_INSTANCE_SPACE,
          externalId: MOCK_ASSETS[assetIndex].externalId,
        },
      },
    ),
    createdTime,
  };
}

export const MOCK_DOCUMENTS: readonly NodeInstance[] = [
  makeMockDocument('doc-mock-1', 0, 96, {
    name: 'Pump datasheet.pdf',
    mimeType: 'application/pdf',
  }),
  makeMockDocument('doc-mock-2', 0, 12, {
    name: 'Inspection photo.png',
    mimeType: 'image/png',
  }),
  makeMockDocument('doc-mock-3', 0, 2, {
    name: 'Maintenance schedule.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    isUploaded: false,
  }),
  makeMockDocument('doc-mock-4', 1, 30, {
    name: 'Compressor manual.pdf',
    mimeType: 'application/pdf',
  }),
];

const MOCK_FILES_INSTANCE_SPACE = 'mock-file-instances';

function makeMockFile(
  externalId: string,
  assetIndexes: number[],
  hoursAgo: number,
  properties: { name: string; mimeType: string },
): NodeInstance {
  const createdTime = Date.now() - hoursAgo * HOUR_MS;

  return {
    ...makeNodeInstance(
      MOCK_FILES_VIEW,
      { space: MOCK_FILES_INSTANCE_SPACE, externalId },
      {
        ...properties,
        isUploaded: true,
        uploadedTime: new Date(createdTime).toISOString(),
        assets: assetIndexes.map((assetIndex) => ({
          space: MOCK_ASSET_INSTANCE_SPACE,
          externalId: MOCK_ASSETS[assetIndex].externalId,
        })),
      },
    ),
    createdTime,
  };
}

export const MOCK_FILES: readonly NodeInstance[] = [
  makeMockFile('file-mock-1', [0, 1], 24 * 90, {
    name: 'Pump data sheet.pdf',
    mimeType: 'application/pdf',
  }),
  makeMockFile('file-mock-2', [0], 24 * 30, {
    name: 'P&ID 1001.pdf',
    mimeType: 'application/pdf',
  }),
];

const MOCK_TIMESERIES_INSTANCE_SPACE = 'mock-timeseries-instances';

type MockTimeseriesProperties = {
  name: string;
  description: string;
  type: string;
  engunits: string;
  isStep: boolean;
  plantName: string;
  unitName: string;
  typicalvalue?: number;
  oweLimitMax?: number;
  oweLimitMin?: number;
  tripLimitMax?: number;
  tripLimitMin?: number;
};

function makeMockTimeseries(
  externalId: string,
  assetIndexes: number[],
  properties: MockTimeseriesProperties,
): NodeInstance {
  return makeNodeInstance(
    MOCK_TIMESERIES_VIEW,
    { space: MOCK_TIMESERIES_INSTANCE_SPACE, externalId },
    {
      ...properties,
      tag: externalId,
      compdev: 0.5,
      assets: assetIndexes.map((assetIndex) => ({
        space: MOCK_ASSET_INSTANCE_SPACE,
        externalId: MOCK_ASSETS[assetIndex].externalId,
      })),
    },
  );
}

export const MOCK_TIMESERIES: readonly NodeInstance[] = [
  makeMockTimeseries('PI.G307.PT-101', [0], {
    name: 'Discharge pressure',
    description: 'Pump discharge pressure',
    type: 'numeric',
    engunits: 'bar',
    isStep: false,
    plantName: 'North Plant',
    unitName: 'Unit 1',
    typicalvalue: 7.5,
    oweLimitMax: 8.5,
    oweLimitMin: 6.5,
    tripLimitMax: 9,
    tripLimitMin: 6,
  }),
  makeMockTimeseries('PI.G307.TT-102', [0, 1], {
    name: 'Motor temperature',
    description: 'Drive end winding temperature',
    type: 'numeric',
    engunits: 'degC',
    isStep: false,
    plantName: 'North Plant',
    unitName: 'Unit 1',
    typicalvalue: 68,
    oweLimitMax: 74,
    tripLimitMax: 78,
  }),
  makeMockTimeseries('PI.G307.XS-103', [0], {
    name: 'Running status',
    description: 'Pump running state',
    type: 'state',
    engunits: 'state',
    isStep: true,
    plantName: 'North Plant',
    unitName: 'Unit 1',
  }),
  makeMockTimeseries('PI.G412.VT-201', [1], {
    name: 'Bearing vibration',
    description: 'Compressor bearing vibration',
    type: 'numeric',
    engunits: 'mm/s',
    isStep: false,
    plantName: 'South Plant',
    unitName: 'Unit 2',
    typicalvalue: 3.1,
    oweLimitMax: 4,
    tripLimitMax: 4.5,
  }),
];
