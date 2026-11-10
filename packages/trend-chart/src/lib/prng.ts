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
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const int = (minimum: number, maximum: number): number => minimum + Math.floor(next() * (maximum - minimum + 1));
  const float = (minimum: number, maximum: number, fractionDigits = 2): number =>
    Number((minimum + next() * (maximum - minimum)).toFixed(fractionDigits));
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
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
