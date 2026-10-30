import { EMPTY_VALUE_LABEL } from '../constants/labels';
import type { RelatedFiles } from '../services/assets/assetService';
import type { EquipmentRecord, FileRecord } from '../types/asset';
import type { AssetPassportRecord, PassportDocument } from '../types/passport';

function toDocument(file: FileRecord, origin: string): PassportDocument {
  return {
    id: file.externalId,
    title: file.name,
    revision: file.revision ?? EMPTY_VALUE_LABEL,
    date: file.date ?? EMPTY_VALUE_LABEL,
    origin,
    instanceId: { space: file.space, externalId: file.externalId },
  };
}

function buildDocuments(item: EquipmentRecord, parentAssetName: string, files: RelatedFiles | undefined): PassportDocument[] {
  if (!files) return [];
  const filesById = new Map(files.equipmentFiles.map((file) => [file.id, file]));
  // A file linked twice from the same equipment is listed once.
  const equipmentFiles = [...new Set((item.fileRefs ?? []).flatMap((ref) => {
    const file = filesById.get(JSON.stringify([ref.space, ref.externalId]));
    return file ? [file] : [];
  }))];
  const equipmentFileIds = new Set(equipmentFiles.map((file) => file.id));
  return [
    ...equipmentFiles.map((file) => toDocument(file, 'Equipment file')),
    ...files.assetFiles
      .filter((file) => !equipmentFileIds.has(file.id))
      .map((file) => toDocument(file, `Asset file · ${parentAssetName}`)),
  ];
}

export function buildEquipmentPassports(
  equipment: EquipmentRecord[],
  parentAssetName: string,
  files?: RelatedFiles
): AssetPassportRecord[] {
  return equipment.map((item) => ({
    asset: {
      id: item.id,
      name: item.name,
      externalId: item.externalId,
      description: item.description,
      area: item.area,
    },
    location: [item.facility, item.area].filter(Boolean).join(' / '),
    specifications: item.details,
    documents: buildDocuments(item, parentAssetName, files),
  }));
}
