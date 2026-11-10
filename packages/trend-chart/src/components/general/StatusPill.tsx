import type { Tone } from '../../enums/display';
import { PillSize } from '../../enums/display';
import { cn } from '../../lib/utils';

/** Height and type size per size; the chrome (tinted face, hard border, bottom ledge) lives in `.chart-pill`. */
const SIZE_CLASSES: Record<PillSize, string> = {
  [PillSize.SMALL]: 'h-5 gap-0.5 px-1.5 text-[11px] leading-none',
  [PillSize.MEDIUM]: 'h-6 gap-1 px-2 text-xs leading-none',
};

interface StatusPillProps {
  label: string;
  tone: Tone;
  size?: PillSize;
  markerColor?: string;
  className?: string;
}

/** A small badge for a status or a short label, in a tone. Use it instead of a raw Aura badge or a hand-made chip. */
export function StatusPill({ label, tone, size = PillSize.MEDIUM, markerColor, className }: StatusPillProps) {
  return (
    <span data-tone={tone} className={cn('chart-pill', markerColor && 'gap-1.5', SIZE_CLASSES[size], className)}>
      {markerColor ? (
        <span
          aria-hidden
          className="inline-block size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: markerColor }}
        />
      ) : null}
      {label}
    </span>
  );
}
