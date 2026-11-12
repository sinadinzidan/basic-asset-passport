/** The constants of the mulberry32 mixing steps. */
const MULBERRY_INCREMENT = 0x6d2b79f5;
const FIRST_SHIFT_BITS = 15;
const SECOND_SHIFT_BITS = 7;
const FINAL_SHIFT_BITS = 14;
const SECOND_MIX_BITS = 61;
const UINT32_RANGE = 4294967296;
const DEFAULT_FRACTION_DIGITS = 2;
const FNV_PRIME = 16777619;

/** Small deterministic generator (mulberry32) so mock data is identical on every load. */
export interface Random {
  next: () => number;
  int: (minimum: number, maximum: number) => number;
  float: (minimum: number, maximum: number, fractionDigits?: number) => number;
  chance: (probability: number) => boolean;
  pick: <Item>(items: readonly Item[]) => Item;
  shuffle: <Item>(items: readonly Item[]) => Item[];
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + MULBERRY_INCREMENT) >>> 0;
    let mixed = Math.imul(state ^ (state >>> FIRST_SHIFT_BITS), 1 | state);
    mixed =
      (mixed + Math.imul(mixed ^ (mixed >>> SECOND_SHIFT_BITS), SECOND_MIX_BITS | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> FINAL_SHIFT_BITS)) >>> 0) / UINT32_RANGE;
  };
  const int = (minimum: number, maximum: number): number =>
    minimum + Math.floor(next() * (maximum - minimum + 1));
  const float = (
    minimum: number,
    maximum: number,
    fractionDigits = DEFAULT_FRACTION_DIGITS,
  ): number => Number((minimum + next() * (maximum - minimum)).toFixed(fractionDigits));
  const chance = (probability: number): boolean => next() < probability;
  const pick = <Item>(items: readonly Item[]): Item => {
    const chosen = items[int(0, items.length - 1)];
    if (chosen === undefined) throw new Error('Cannot pick from an empty list.');
    return chosen;
  };
  const shuffle = <Item>(items: readonly Item[]): Item[] => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
      const swapIndex = int(0, index);
      const held = copy[index];
      const swapped = copy[swapIndex];
      if (held === undefined || swapped === undefined) continue;
      copy[index] = swapped;
      copy[swapIndex] = held;
    }
    return copy;
  };
  return { next, int, float, chance, pick, shuffle };
}

export function seedFromText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}
