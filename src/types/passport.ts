import type { AssetRecord, InstanceReference, LabeledValue } from './asset';

export interface PassportDocument {
  id: string;
  title: string;
  revision: string;
  date: string;
  origin: string;
  instanceId: InstanceReference;
}

export interface AssetPassportRecord {
  asset: AssetRecord;
  location: string;
  specifications: LabeledValue[];
  documents: PassportDocument[];
}
