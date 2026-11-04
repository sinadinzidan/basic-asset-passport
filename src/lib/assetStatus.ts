import { OPERATING_ASSET_STATUS } from '../constants/assets';

export type StatusTone = 'active' | 'warning' | 'neutral';

const MAINTENANCE_STATUS_PATTERN = /maint/i;

export function isOperatingStatus(status: string | null): boolean {
  return status?.trim().toLowerCase() === OPERATING_ASSET_STATUS;
}

// Operating is lit, anything under maintenance is a warning, and every other
// status (for example decommissioned) is muted.
export function getStatusTone(status: string | null): StatusTone {
  if (isOperatingStatus(status)) return 'active';
  if (status && MAINTENANCE_STATUS_PATTERN.test(status)) return 'warning';
  return 'neutral';
}
