import { CriticalityTone } from '../enums/criticalityTone';
const CRITICALITY_CLASS_PATTERN = /^\s*([abc])\b/i;

const TONE_BY_CRITICALITY_CLASS: Record<string, CriticalityTone> = {
  a: CriticalityTone.ERROR,
  b: CriticalityTone.WARNING,
  c: CriticalityTone.SUCCESS,
};

export function getCriticalityTone(criticality: string): CriticalityTone {
  const letter = CRITICALITY_CLASS_PATTERN.exec(criticality)?.[1];

  return (letter && TONE_BY_CRITICALITY_CLASS[letter.toLowerCase()]) || CriticalityTone.NEUTRAL;
}
