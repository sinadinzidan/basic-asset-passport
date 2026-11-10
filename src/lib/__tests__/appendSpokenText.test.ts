import { describe, expect, it } from 'vitest';

import { appendSpokenText } from '../appendSpokenText';

describe(appendSpokenText.name, () => {
  it('starts the draft with the spoken words', () => {
    expect(appendSpokenText('', '  which pumps leak ')).toBe(
      'which pumps leak',
    );
  });

  it('adds the spoken words after what was typed, with one space between', () => {
    expect(appendSpokenText('Check', 'the strainer')).toBe(
      'Check the strainer',
    );
  });

  it('does not add a second space after typed whitespace or a new line', () => {
    expect(appendSpokenText('Check ', 'the strainer')).toBe(
      'Check the strainer',
    );
    expect(appendSpokenText('Check\n', 'the strainer')).toBe(
      'Check\nthe strainer',
    );
  });

  it('keeps the draft as it is when nothing was heard', () => {
    expect(appendSpokenText('Check', '   ')).toBe('Check');
  });
});
