import type { ThreeDLoadProgress } from '../../types/threeD';

export function formatThreeDProgress(progress: ThreeDLoadProgress): string {
  const { loadedSectors, failedSectors, skippedSectors, totalSectors } = progress;
  const done = loadedSectors + failedSectors + skippedSectors;
  const parts = [`${done} of ${totalSectors} parts`];

  if (failedSectors > 0) parts.push(`${failedSectors} failed`);

  if (skippedSectors > 0) parts.push(`${skippedSectors} skipped`);

  return parts.join(', ');
}

export function formatUnsupportedShapes(progress: ThreeDLoadProgress): string | null {
  const entries = Object.entries(progress.unsupported);

  if (entries.length === 0) return null;

  return entries.map(([name, count]) => `${name}: ${count}`).join(', ');
}

export function isThreeDLoadingDone(progress: ThreeDLoadProgress): boolean {
  const { loadedSectors, failedSectors, skippedSectors, totalSectors } = progress;

  return totalSectors > 0 && loadedSectors + failedSectors + skippedSectors >= totalSectors;
}
