export type AssetNote = {
  space: string;
  externalId: string;
  title: string;
  body: string | null;
  author: string | null;
  createdTime: number;
};

export type NoteIdentifier = Pick<AssetNote, 'space' | 'externalId'>;

export type NewAssetNote = {
  title: string;
  body: string;
};
