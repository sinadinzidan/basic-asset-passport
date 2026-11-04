import { OPERATING_ASSET_STATUS } from '../constants/assets';

export function isOperatingStatus(status: string | null): boolean {
  return status?.trim().toLowerCase() === OPERATING_ASSET_STATUS;
}
