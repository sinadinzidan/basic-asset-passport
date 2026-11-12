import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AssetNoteFields } from '../AssetNoteFields';

describe(AssetNoteFields.name, () => {
  it('hints at what to write in the empty title field', () => {
    renderFields();

    expect(screen.getByLabelText(/^Title/)).toHaveAttribute(
      'placeholder',
      'Give the note a short title',
    );
  });

  it('hints at what to write in the empty note field', () => {
    renderFields();

    expect(screen.getByLabelText('Note')).toHaveAttribute('placeholder', 'Write what you found');
  });

  it('shows the text the fields hold', () => {
    renderFields({ title: 'Seal inspection', body: 'No leaks' });

    expect(screen.getByLabelText(/^Title/)).toHaveValue('Seal inspection');
    expect(screen.getByLabelText('Note')).toHaveValue('No leaks');
  });
});

type FieldValues = { title?: string; body?: string };

function renderFields({ title = '', body = '' }: FieldValues = {}) {
  render(
    <AssetNoteFields
      idPrefix="test"
      title={title}
      body={body}
      onTitleChange={vi.fn()}
      onBodyChange={vi.fn()}
    />,
  );
}
