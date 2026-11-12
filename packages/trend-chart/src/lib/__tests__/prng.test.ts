import { describe, expect, it } from 'vitest';

import { createRandom, seedFromText } from '../prng';

const SAMPLE_COUNT = 200;
const FNV_OFFSET_BASIS = 2166136261;

describe(createRandom.name, () => {
  it('gives the same sequence for the same seed', () => {
    const first = createRandom(42);
    const second = createRandom(42);

    expect(sample(first.next)).toEqual(sample(second.next));
  });

  it('gives another sequence for another seed', () => {
    const first = createRandom(42);
    const second = createRandom(43);

    expect(sample(first.next)).not.toEqual(sample(second.next));
  });

  it('returns numbers from 0 up to but not including 1', () => {
    const values = sample(createRandom(7).next);

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });

  it('picks whole numbers between the two limits, both included', () => {
    const random = createRandom(7);

    const values = new Set(sample(() => random.int(1, 3)));

    expect([...values].sort()).toEqual([1, 2, 3]);
  });

  it('rounds a decimal number to the asked number of digits, inside the limits', () => {
    const random = createRandom(7);

    const values = sample(() => random.float(2, 5, 1));

    expect(values.every((value) => value === Number(value.toFixed(1)))).toBe(true);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...values)).toBeLessThanOrEqual(5);
  });

  it('rounds a decimal number to two digits unless told otherwise', () => {
    const random = createRandom(7);

    const values = sample(() => random.float(0, 1));

    expect(values.every((value) => value === Number(value.toFixed(2)))).toBe(true);
    expect(values.some((value) => value !== Number(value.toFixed(1)))).toBe(true);
  });

  it('never succeeds at a chance of 0 and always at a chance of 1', () => {
    const random = createRandom(7);

    expect(sample(() => random.chance(0)).some(Boolean)).toBe(false);
    expect(sample(() => random.chance(1)).every(Boolean)).toBe(true);
  });

  it('picks every item of a list sooner or later, and nothing else', () => {
    const random = createRandom(7);
    const items = ['pump', 'valve', 'motor'];

    const picked = new Set(sample(() => random.pick(items)));

    expect([...picked].sort()).toEqual([...items].sort());
  });

  it('refuses to pick from an empty list', () => {
    const random = createRandom(7);

    expect(() => random.pick([])).toThrow('Cannot pick from an empty list.');
  });

  it('shuffles into a new list with the same items, leaving the given list as it was', () => {
    const random = createRandom(7);
    const items = [1, 2, 3, 4, 5, 6, 7, 8];

    const shuffled = random.shuffle(items);

    expect(shuffled).not.toBe(items);
    expect(shuffled).not.toEqual(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe(seedFromText.name, () => {
  it('gives the same seed for the same text', () => {
    expect(seedFromText('PT-101')).toBe(seedFromText('PT-101'));
  });

  it('gives another seed for another text', () => {
    expect(seedFromText('PT-101')).not.toBe(seedFromText('PT-102'));
  });

  it('is a whole number that is never negative', () => {
    const seeds = ['PT-101', 'a', 'Discharge pressure', '°C'].map(seedFromText);

    expect(seeds.every((seed) => Number.isInteger(seed) && seed >= 0)).toBe(true);
  });

  it('starts from the same seed for an empty text', () => {
    expect(seedFromText('')).toBe(FNV_OFFSET_BASIS);
  });
});

function sample<Value>(draw: () => Value): Value[] {
  return Array.from({ length: SAMPLE_COUNT }, () => draw());
}
