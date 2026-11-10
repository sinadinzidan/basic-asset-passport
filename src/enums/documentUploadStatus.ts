/** Where a document is in its upload: done, just sent and being processed by CDF, or never finished. */
export enum DocumentUploadStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  INCOMPLETE = 'INCOMPLETE',
}
