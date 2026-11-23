const CLASSES = ['A', 'B', 'C'] as const;
const HASH_MULTIPLIER = 31;

export function dummyCriticality(name: string): string {
  const hash = [...name].reduce(
    (total, character) => (total * HASH_MULTIPLIER + (character.codePointAt(0) ?? 0)) >>> 0,
    0,
  );

  return CLASSES[hash % CLASSES.length];
}
