import { formatCount } from './countBadge';

export function formatNoMatchingAssetsMessage(searchQuery: string): string {
  return `No asset matches "${searchQuery}". Try a different name, description or plant.`;
}

export function formatEquipmentTruncatedMessage(shownCount: number): string {
  return `Showing the first ${formatCount(shownCount)} equipment, sorted by name. This asset has more.`;
}
