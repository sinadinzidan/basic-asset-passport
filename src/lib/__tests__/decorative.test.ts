import { describe, expect, it } from 'vitest';

import { decorativeVariantFor, initialsOf } from '../decorative';

describe('decorative helpers', () => {
  it('maps the same key to the same decorative variant', () => {
    expect(decorativeVariantFor('Feedwater pump 1')).toBe(decorativeVariantFor('Feedwater pump 1'));
    expect(['fjord', 'nordic', 'aurora', 'dusk', 'orange', 'sky']).toContain(decorativeVariantFor('P-101'));
  });
  it('spreads different keys over more than one variant', () => {
    const variants = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(decorativeVariantFor));
    expect(variants.size).toBeGreaterThan(1);
  });
  it('builds initials from the first two words or the first two characters', () => {
    expect(initialsOf('Feedwater pump 1')).toBe('FP');
    expect(initialsOf('compressor')).toBe('CO');
    expect(initialsOf('  ')).toBe('?');
  });
  it('never splits a character outside the Basic Multilingual Plane', () => {
    expect(initialsOf('𝒜𝒷𝒸 asset')).toBe('𝒜A');
    expect(initialsOf('𝒜𝒷𝒸')).toBe('𝒜𝒷');
    expect(initialsOf('原油ポンプ 一号')).toBe('原一');
  });
});
