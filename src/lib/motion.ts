// Aura "Entrance" curve and the 400ms content-entrance band from its motion guidance.
export const ENTRANCE_EASE = [0, 0, 0.15, 1] as const;
const ENTRANCE_DURATION_SECONDS = 0.4;
const STAGGER_SECONDS = 0.04;
const MAX_STAGGERED_ITEMS = 10;
const REVEAL_OFFSET_PX = 12;

export function revealMotion(index: number, reduceMotion: boolean | null) {
  if (reduceMotion) return {};
  return {
    initial: { opacity: 0, y: REVEAL_OFFSET_PX },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ENTRANCE_DURATION_SECONDS, ease: ENTRANCE_EASE, delay: Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_SECONDS },
  };
}
