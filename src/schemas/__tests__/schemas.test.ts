import { describe, expect, it } from 'vitest';

import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '../../constants/notes';
import { AssetTab } from '../../enums/assetTab';
import {
  AgentListResponseSchema,
  AgentMessageSchema,
  AgentReplyResponseSchema,
  AgentSchema,
} from '../agent';
import { AssetIdentifierSchema, AssetListPropertiesSchema } from '../asset';
import { DocumentPropertiesSchema, UploadLinkResponseSchema } from '../document';
import { NavigationStateSchema } from '../navigation';
import { NewAssetNoteSchema, NotePropertiesSchema } from '../note';
import { OptionalTextSchema } from '../text';
import {
  AverageDatapointSchema,
  DatapointsItemSchema,
  DatapointsResponseSchema,
} from '../timeseries';

describe('OptionalTextSchema', () => {
  it('keeps text as it is', () => {
    expect(OptionalTextSchema.parse(' Pump ')).toBe(' Pump ');
  });

  it.each([[undefined], [null], [''], ['   ']])('reads %j as no text', (value) => {
    expect(OptionalTextSchema.parse(value)).toBeNull();
  });

  it('rejects a value that is not text', () => {
    expect(OptionalTextSchema.safeParse(42).success).toBe(false);
  });
});

describe('AssetListPropertiesSchema', () => {
  it('reads the list properties and fills the missing ones with null', () => {
    expect(AssetListPropertiesSchema.parse({ name: 'Pump', flocStatus: 'Operating' })).toEqual({
      name: 'Pump',
      description: null,
      plantName: null,
      flocStatus: 'Operating',
      abcIndicatorName: null,
    });
  });

  it('drops properties the list does not show', () => {
    expect(AssetListPropertiesSchema.parse({ name: 'Pump', uid: 'x' })).not.toHaveProperty('uid');
  });

  it('rejects a property of the wrong type', () => {
    expect(AssetListPropertiesSchema.safeParse({ name: 42 }).success).toBe(false);
  });
});

describe('AssetIdentifierSchema', () => {
  it('keeps only the space and external ID', () => {
    expect(AssetIdentifierSchema.parse({ space: 's', externalId: 'x', name: 'Pump' })).toEqual({
      space: 's',
      externalId: 'x',
    });
  });

  it('rejects an identifier without an external ID', () => {
    expect(AssetIdentifierSchema.safeParse({ space: 's' }).success).toBe(false);
  });
});

describe('NotePropertiesSchema', () => {
  it('reads the title, text and author, with null for what is missing or blank', () => {
    expect(NotePropertiesSchema.parse({ title: 'Seal', body: '  ' })).toEqual({
      title: 'Seal',
      body: null,
      author: null,
    });
  });
});

describe('NewAssetNoteSchema', () => {
  it('trims the title and the text', () => {
    expect(NewAssetNoteSchema.parse({ title: ' Seal ', body: ' Fine ' })).toEqual({
      title: 'Seal',
      body: 'Fine',
    });
  });

  it('accepts a note without text', () => {
    expect(NewAssetNoteSchema.parse({ title: 'Seal', body: '   ' })).toEqual({
      title: 'Seal',
      body: '',
    });
  });

  it('rejects a blank title', () => {
    expect(NewAssetNoteSchema.safeParse({ title: '   ', body: 'Fine' }).success).toBe(false);
  });

  it('rejects a title or a text that is too long', () => {
    const longTitle = 'a'.repeat(NOTE_TITLE_MAX_LENGTH + 1);
    const longBody = 'a'.repeat(NOTE_BODY_MAX_LENGTH + 1);

    expect(NewAssetNoteSchema.safeParse({ title: longTitle, body: '' }).success).toBe(false);
    expect(NewAssetNoteSchema.safeParse({ title: 'Seal', body: longBody }).success).toBe(false);
  });

  it('accepts a title and a text of exactly the longest length', () => {
    const title = 'a'.repeat(NOTE_TITLE_MAX_LENGTH);
    const body = 'a'.repeat(NOTE_BODY_MAX_LENGTH);

    expect(NewAssetNoteSchema.safeParse({ title, body }).success).toBe(true);
  });
});

describe('DocumentPropertiesSchema', () => {
  it('reads the file properties and turns the upload time into milliseconds', () => {
    expect(
      DocumentPropertiesSchema.parse({
        name: 'Manual.pdf',
        mimeType: 'application/pdf',
        isUploaded: true,
        uploadedTime: '2026-11-05T12:00:00.000Z',
      }),
    ).toEqual({
      name: 'Manual.pdf',
      mimeType: 'application/pdf',
      isUploaded: true,
      uploadedTime: Date.UTC(2026, 10, 5, 12),
    });
  });

  it('reads a file that is not uploaded yet', () => {
    expect(DocumentPropertiesSchema.parse({})).toEqual({
      name: null,
      mimeType: null,
      isUploaded: false,
      uploadedTime: null,
    });
  });

  it('has no upload time when the time cannot be read', () => {
    expect(DocumentPropertiesSchema.parse({ uploadedTime: 'soon' }).uploadedTime).toBeNull();
  });
});

describe('UploadLinkResponseSchema', () => {
  it('reads the upload link of the first item', () => {
    const parsed = UploadLinkResponseSchema.parse({
      items: [{ uploadUrl: 'https://upload.test/1' }, { uploadUrl: 'https://upload.test/2' }],
    });

    expect(parsed.items[0].uploadUrl).toBe('https://upload.test/1');
  });

  it.each([[{}], [{ items: [] }], [{ items: [{ uploadUrl: '' }] }], [{ items: ['x'] }]])(
    'rejects %j, which holds no link',
    (data) => {
      expect(UploadLinkResponseSchema.safeParse(data).success).toBe(false);
    },
  );
});

describe('datapoints schemas', () => {
  it('reads the items of a datapoints answer', () => {
    expect(DatapointsResponseSchema.parse({ items: ['a'] }).items).toEqual(['a']);
    expect(DatapointsResponseSchema.safeParse({}).success).toBe(false);
  });

  it('reads the series of an item, with no readings when it lists none', () => {
    expect(DatapointsItemSchema.parse({ instanceId: { space: 'ts', externalId: 'PI.1' } })).toEqual(
      {
        instanceId: { space: 'ts', externalId: 'PI.1' },
        datapoints: [],
      },
    );
    expect(DatapointsItemSchema.safeParse({ instanceId: 'nope' }).success).toBe(false);
  });

  it('reads a reading only when it has a time and an average', () => {
    expect(AverageDatapointSchema.safeParse({ timestamp: 1, average: 2 }).success).toBe(true);
    expect(AverageDatapointSchema.safeParse({ timestamp: 1 }).success).toBe(false);
  });
});

describe('agent schemas', () => {
  it('reads the items of an agent lookup', () => {
    expect(AgentListResponseSchema.safeParse({ items: [] }).success).toBe(true);
    expect(AgentListResponseSchema.safeParse({ agents: [] }).success).toBe(false);
  });

  it('reads an agent that has an external ID, with or without a name', () => {
    expect(AgentSchema.safeParse({ externalId: 'a' }).success).toBe(true);
    expect(AgentSchema.safeParse({ externalId: '' }).success).toBe(false);
    expect(AgentSchema.safeParse({ name: 'No ID' }).success).toBe(false);
  });

  it('reads a reply that lists messages, with or without a cursor', () => {
    expect(AgentReplyResponseSchema.safeParse({ response: { messages: [] } }).success).toBe(true);
    expect(AgentReplyResponseSchema.safeParse({ response: {} }).success).toBe(false);
    expect(AgentReplyResponseSchema.safeParse({}).success).toBe(false);
  });

  it('reads a message, leaving out a content or actions it does not understand', () => {
    expect(AgentMessageSchema.parse({ role: 'agent', content: 'text', actions: 'x' })).toEqual({
      role: 'agent',
      content: undefined,
      actions: undefined,
    });
    expect(AgentMessageSchema.parse({ content: { text: 'Hi' }, actions: [1] })).toEqual({
      content: { text: 'Hi' },
      actions: [1],
    });
  });
});

describe('NavigationStateSchema', () => {
  it('reads a full state as it was stored', () => {
    const state = {
      selectedAsset: { space: 's', externalId: 'x' },
      activeAssetTab: AssetTab.NOTES,
      searchQuery: 'pump',
      registerCursors: ['c2'],
      timeseriesChart: { sig: 'ts:PI.1' },
      isAssistantOpen: true,
    };

    expect(NavigationStateSchema.parse(state)).toEqual(state);
  });

  it('falls back field by field on what it cannot read', () => {
    expect(
      NavigationStateSchema.parse({
        selectedAsset: 'x',
        activeAssetTab: 'NOPE',
        searchQuery: 7,
        registerCursors: ['c2', ''],
        timeseriesChart: {},
        isAssistantOpen: 'yes',
      }),
    ).toEqual({
      selectedAsset: null,
      activeAssetTab: AssetTab.PROPERTIES,
      searchQuery: '',
      registerCursors: [],
    });
  });

  it('rejects a state that is not an object', () => {
    expect(NavigationStateSchema.safeParse('x').success).toBe(false);
  });
});
