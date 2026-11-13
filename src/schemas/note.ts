import { z } from 'zod';

import { MODEL } from '../config/model';
import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '../constants/notes';

import { OptionalTextSchema } from './text';

const PROPERTIES = MODEL.properties.note;

export const NotePropertiesSchema = z.object({
  [PROPERTIES.title]: OptionalTextSchema,
  [PROPERTIES.body]: OptionalTextSchema,
  [PROPERTIES.author]: OptionalTextSchema,
  [PROPERTIES.createdAt]: OptionalTextSchema,
});

export const NewAssetNoteSchema = z.object({
  title: z.string().trim().min(1).max(NOTE_TITLE_MAX_LENGTH),
  body: z.string().trim().max(NOTE_BODY_MAX_LENGTH),
});
