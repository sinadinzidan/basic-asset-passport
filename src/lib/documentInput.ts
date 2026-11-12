import {
  DOCUMENT_EMPTY_FILE_MESSAGE,
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  DOCUMENT_TOO_LARGE_MESSAGE,
} from '../constants/documents';

export function getDocumentFileProblem(file: Pick<File, 'size'>): string | null {
  if (file.size === 0) return DOCUMENT_EMPTY_FILE_MESSAGE;
  if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) return DOCUMENT_TOO_LARGE_MESSAGE;

  return null;
}
