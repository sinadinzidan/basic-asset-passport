import { OPERATING_ASSET_STATUS } from '../constants/assets';
import { StatusTone } from '../enums/statusTone';

const MAINTENANCE_STATUS_PATTERN = /maint/i;

export function isOperatingStatus(status: string | null): boolean {
  return status?.trim().toLowerCase() === OPERATING_ASSET_STATUS;
}

export function getStatusTone(status: string | null): StatusTone {
  if (isOperatingStatus(status)) return StatusTone.ACTIVE;

  if (status && MAINTENANCE_STATUS_PATTERN.test(status)) return StatusTone.WARNING;

  return StatusTone.NEUTRAL;
}
