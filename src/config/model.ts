export const MODEL = {
  space: 'sp-asset-passport',
  externalId: 'Asset_Passport',
  version: '1',
  instanceSpace: 'sp-asset-passport-data',
  views: {
    asset: 'Asset',
    equipment: 'Equipment',
    timeseries: 'PI_Timeseries',
    note: 'Note',
    document: 'Document',
  },
  filesView: {
    space: 'sp-dm-idi-rmdm',
    externalId: 'Files',
    version: 'v1',
  },
  properties: {
    assetRelation: 'asset',
    asset: {
      name: 'name',
      description: 'description',
      plantName: 'plantName',
      status: 'flocStatus',
      criticality: 'abcIndicatorName',
    },
    note: {
      title: 'title',
      body: 'body',
      author: 'author',
      authorId: 'authorId',
    },
    document: {
      name: 'name',
      mimeType: 'mimeType',
      isUploaded: 'isUploaded',
      uploadedTime: 'uploadedTime',
    },
    files: {
      assets: 'assets',
    },
    timeseries: {
      assets: 'assets',
      type: 'type',
      unit: 'engunits',
      oweLimitMin: 'oweLimitMin',
      oweLimitMax: 'oweLimitMax',
      dleLimitMin: 'dleLimitMin',
      dleLimitMax: 'dleLimitMax',
      tripLimitMin: 'tripLimitMin',
      tripLimitMax: 'tripLimitMax',
    },
  },
} as const;
