import { MILLISECONDS_PER_DAY, MILLISECONDS_PER_HOUR } from '../../constants/formats';
import { MILLISECONDS_PER_MINUTE } from '../../constants/monitoring';
import { MISSING_VALUE } from '../format';

export function formatDuration(milliseconds: number | undefined): string {
  if (milliseconds === undefined || Number.isNaN(milliseconds) || milliseconds < 0) return MISSING_VALUE;
  if (milliseconds < MILLISECONDS_PER_MINUTE) return '< 1 min';
  const days = Math.floor(milliseconds / MILLISECONDS_PER_DAY);
  const hours = Math.floor((milliseconds % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_HOUR);
  const minutes = Math.floor((milliseconds % MILLISECONDS_PER_HOUR) / MILLISECONDS_PER_MINUTE);
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}
