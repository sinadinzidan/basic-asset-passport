import type { AssetInstanceDetails } from '../types/asset';

export function getPropertyValue(
  instance: AssetInstanceDetails | undefined,
  identifier: string,
): string | undefined {
  return instance?.properties.find((property) => property.identifier === identifier)?.value;
}
