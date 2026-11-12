import { describe, expect, it } from 'vitest';

import { makeNodeInstance, makeViewDefinition } from '../../../__mocks__/cdf';
import { TestPropertyType } from '../../../enums/testPropertyType';
import { getMappedProperties, toInstanceDetails } from '../instanceDetails';

const identifier = { space: 'instances', externalId: 'P-1' };

describe(getMappedProperties.name, () => {
  it('labels each property with its view name, or its identifier when it has none', () => {
    const view = makeViewDefinition('Equipment', {
      name: { label: 'Name' },
      serialNumber: {},
      plantName: { label: '   ' },
    });

    expect(getMappedProperties(view)).toEqual([
      { identifier: 'name', label: 'Name' },
      { identifier: 'serialNumber', label: 'serialNumber' },
      { identifier: 'plantName', label: 'plantName' },
    ]);
  });

  it('leaves out relations and JSON properties', () => {
    const view = makeViewDefinition('Equipment', {
      name: { label: 'Name' },
      asset: { type: TestPropertyType.DIRECT },
      payload: { type: TestPropertyType.JSON },
    });

    expect(getMappedProperties(view)).toEqual([{ identifier: 'name', label: 'Name' }]);
  });

  it('leaves out system and source-tracking properties', () => {
    const view = makeViewDefinition('Equipment', {
      name: { label: 'Name' },
      sourceId: { label: 'Source ID' },
      uid: { label: 'UID' },
      createdByUser: { label: 'Created by' },
    });

    expect(getMappedProperties(view)).toEqual([{ identifier: 'name', label: 'Name' }]);
  });

  it('leaves out a property the view does not map to a container, such as a reverse relation', () => {
    const view = makeViewDefinition('Equipment', { name: { label: 'Name' } });
    const withReverseRelation = {
      ...view,
      properties: {
        ...view.properties,
        files: {
          connectionType: 'multi_reverse_direct_relation' as const,
          source: { type: 'view' as const, space: 's', externalId: 'Files', version: 'v1' },
          through: {
            source: { type: 'view' as const, space: 's', externalId: 'Files', version: 'v1' },
            identifier: 'equipment',
          },
          targetsList: false,
        },
      },
    };

    expect(getMappedProperties(withReverseRelation)).toEqual([
      { identifier: 'name', label: 'Name' },
    ]);
  });
});

describe(toInstanceDetails.name, () => {
  const view = makeViewDefinition('Equipment', {
    name: { label: 'Name' },
    weight: { label: 'Weight' },
    isCritical: { label: 'Critical' },
    tags: { label: 'Tags' },
    extra: { label: 'Extra' },
  });
  const mappedProperties = getMappedProperties(view);

  it('keeps the identity of the node', () => {
    const node = makeNodeInstance(view, identifier, {});

    expect(toInstanceDetails(node, view, mappedProperties)).toEqual({
      space: 'instances',
      externalId: 'P-1',
      properties: [],
    });
  });

  it('shows text trimmed, and numbers and booleans as text, in the order of the view', () => {
    const node = makeNodeInstance(view, identifier, {
      isCritical: true,
      weight: 12.5,
      name: '  Feed pump  ',
    });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([
      { identifier: 'name', label: 'Name', value: 'Feed pump' },
      { identifier: 'weight', label: 'Weight', value: '12.5' },
      { identifier: 'isCritical', label: 'Critical', value: 'true' },
    ]);
  });

  it('keeps a zero and a false, which are values', () => {
    const node = makeNodeInstance(view, identifier, { weight: 0, isCritical: false });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([
      { identifier: 'weight', label: 'Weight', value: '0' },
      { identifier: 'isCritical', label: 'Critical', value: 'false' },
    ]);
  });

  it('leaves out properties without a value', () => {
    const node = makeNodeInstance(view, identifier, {
      name: '   ',
      weight: Number.NaN,
      tags: [],
      extra: {},
    });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([]);
  });

  it('joins a list with commas, skipping its empty items', () => {
    const node = makeNodeInstance(view, identifier, { tags: ['pump', ' ', 'cooling', 3] });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([
      { identifier: 'tags', label: 'Tags', value: 'pump, cooling, 3' },
    ]);
  });

  it('shows an object as JSON', () => {
    const node = makeNodeInstance(view, identifier, { extra: { space: 's', externalId: 'x' } });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([
      { identifier: 'extra', label: 'Extra', value: '{"space":"s","externalId":"x"}' },
    ]);
  });

  it('has no properties when the node holds no data for the view', () => {
    const otherView = makeViewDefinition('Asset', { name: {} }, 'v9', 'other-space');
    const node = makeNodeInstance(otherView, identifier, { name: 'Feed pump' });

    expect(toInstanceDetails(node, view, mappedProperties).properties).toEqual([]);
  });

  it('shows only the properties it was told to map', () => {
    const node = makeNodeInstance(view, identifier, { name: 'Feed pump', weight: 4 });

    expect(
      toInstanceDetails(node, view, [{ identifier: 'weight', label: 'Weight' }]).properties,
    ).toEqual([{ identifier: 'weight', label: 'Weight', value: '4' }]);
  });
});
