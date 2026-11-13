import { describe, expect, it } from 'vitest';

import { makeViewDefinition } from '../../../__mocks__/cdf';
import { SORT_BY_EXTERNAL_ID, SORT_BY_NEWEST, sortByName, sortByViewProperty } from '../querySort';

const view = makeViewDefinition('Equipment', { name: {} }, 'v1', 'sp-model');

describe(sortByViewProperty.name, () => {
  it('sorts ascending with empty values last unless told otherwise', () => {
    expect(sortByViewProperty(view, 'name')).toEqual({
      property: ['sp-model', 'Equipment/v1', 'name'],
      direction: 'ascending',
      nullsFirst: false,
    });
  });

  it('sorts in the given order', () => {
    expect(
      sortByViewProperty(view, 'uploadedTime', {
        direction: 'descending',
        nullsFirst: true,
      }),
    ).toEqual({
      property: ['sp-model', 'Equipment/v1', 'uploadedTime'],
      direction: 'descending',
      nullsFirst: true,
    });
  });
});

describe(sortByName.name, () => {
  it('sorts by name, then by external ID', () => {
    expect(sortByName(view)).toEqual([
      {
        property: ['sp-model', 'Equipment/v1', 'name'],
        direction: 'ascending',
        nullsFirst: false,
      },
      SORT_BY_EXTERNAL_ID,
    ]);
  });

  it('sorts a view without a name by external ID alone', () => {
    const unnamedView = makeViewDefinition('Equipment', { tag: {} });

    expect(sortByName(unnamedView)).toEqual([SORT_BY_EXTERNAL_ID]);
  });
});

describe('SORT_BY_NEWEST', () => {
  it('sorts by when the instance was created, the newest first, in the one-part form CDF accepts', () => {
    expect(SORT_BY_NEWEST).toEqual({
      property: ['createdTime'],
      direction: 'descending',
      nullsFirst: false,
    });
  });
});
