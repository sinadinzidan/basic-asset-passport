import { Loader } from '@cognite/aura/components/loader';

import { LOADER_SIZE_DEFAULT_PX, LOADER_SIZE_SMALL_PX } from '../../constants/ui';

const LOADER_SIZES = { small: LOADER_SIZE_SMALL_PX, default: LOADER_SIZE_DEFAULT_PX } as const;

/** A spinner with a status message; every "Loading …" text in the app comes through here, so the wording is uniform. */
export function LoadingNotice({ label, size = 'default', className = '' }: {
  /** What is loading, without the ellipsis (for example "Loading files"). */
  label: string;
  size?: keyof typeof LOADER_SIZES;
  className?: string;
}) {
  return (
    <div role="status" className={`inline-flex items-center gap-3 text-muted-foreground ${className}`.trim()}>
      <Loader size={LOADER_SIZES[size]} aria-hidden />
      <span>{label}…</span>
    </div>
  );
}
