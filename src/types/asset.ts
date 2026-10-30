export interface InstanceReference {
  space: string;
  externalId: string;
}

export interface NamedInstanceReference extends InstanceReference {
  name: string;
}

export type AssetSelection = NamedInstanceReference;
export type FileSelection = NamedInstanceReference;

export interface LabeledValue {
  label: string;
  value: string;
}

export type EquipmentDetail = LabeledValue;

export interface FileRecord extends NamedInstanceReference {
  id: string;
  description?: string;
  mimeType?: string;
  revision?: string;
  date?: string;
}

export interface EquipmentRecord extends NamedInstanceReference {
  id: string;
  description?: string;
  area?: string;
  facility?: string;
  details: EquipmentDetail[];
  fileRefs?: InstanceReference[];
}

export interface AssetRecord {
  id: number | string;
  space?: string;
  name: string;
  externalId?: string;
  description?: string;
  area?: string;
}
