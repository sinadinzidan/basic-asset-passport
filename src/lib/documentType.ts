import { DocumentKind } from '../enums/documentKind';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/svg+xml': 'SVG',
  'text/plain': 'Text',
  'text/csv': 'CSV',
  'application/json': 'JSON',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
};

const UNKNOWN_DOCUMENT_TYPE_LABEL = 'File';

export function formatDocumentType(mimeType: string | null): string {
  if (mimeType === null) return UNKNOWN_DOCUMENT_TYPE_LABEL;

  const [baseType] = mimeType.split(';');

  return DOCUMENT_TYPE_LABELS[baseType.trim().toLowerCase()] ?? UNKNOWN_DOCUMENT_TYPE_LABEL;
}

const DOCUMENT_KINDS: Record<string, DocumentKind> = {
  'application/pdf': DocumentKind.PDF,
  'text/csv': DocumentKind.SPREADSHEET,
  'application/vnd.ms-excel': DocumentKind.SPREADSHEET,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': DocumentKind.SPREADSHEET,
  'text/plain': DocumentKind.DOCUMENT,
  'application/msword': DocumentKind.DOCUMENT,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentKind.DOCUMENT,
  'application/vnd.ms-powerpoint': DocumentKind.PRESENTATION,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    DocumentKind.PRESENTATION,
  'application/json': DocumentKind.DATA,
};

export function getDocumentKind(mimeType: string | null): DocumentKind {
  if (mimeType === null) return DocumentKind.FILE;

  const [baseType] = mimeType.split(';');
  const normalizedType = baseType.trim().toLowerCase();

  if (normalizedType.startsWith('image/')) return DocumentKind.IMAGE;

  return DOCUMENT_KINDS[normalizedType] ?? DocumentKind.FILE;
}
