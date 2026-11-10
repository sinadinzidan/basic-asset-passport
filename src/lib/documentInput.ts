import {
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  DOCUMENT_MAX_FILE_SIZE_LABEL,
} from '../constants/documents';

/** Why a file cannot be uploaded as a document, or null when it can. */
export function getDocumentFileProblem(
  file: Pick<File, 'size'>,
): string | null {
  if (file.size === 0) return 'The file is empty.';

  if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) {
    return `The file is larger than ${DOCUMENT_MAX_FILE_SIZE_LABEL}.`;
  }

  return null;
}
