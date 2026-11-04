export type CriticalityTone = 'error' | 'warning' | 'success' | 'neutral';

const CRITICALITY_CLASS_PATTERN = /^\s*([abc])\b/i;

const TONE_BY_CRITICALITY_CLASS: Record<string, CriticalityTone> = {
  a: 'error',
  b: 'warning',
  c: 'success',
};

// CDF stores criticality as free text that starts with its class letter,
// for example "A - High criticality".
export function getCriticalityTone(criticality: string): CriticalityTone {
  const letter = CRITICALITY_CLASS_PATTERN.exec(criticality)?.[1];
  return (
    (letter && TONE_BY_CRITICALITY_CLASS[letter.toLowerCase()]) || 'neutral'
  );
}
