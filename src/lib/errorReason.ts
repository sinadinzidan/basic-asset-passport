import { isRecord } from './isRecord';

export function getErrorReason(error: unknown): string | null {
  const message = readMessage(error);
  if (message === null) return null;

  const status = isRecord(error) ? error.status : undefined;
  return typeof status === 'number' ? `${message} (HTTP ${status})` : message;
}

function readMessage(error: unknown): string | null {
  if (isRecord(error) && typeof error.errorMessage === 'string') {
    return toReadableText(error.errorMessage);
  }
  return error instanceof Error ? toReadableText(error.message) : null;
}

function toReadableText(text: string): string | null {
  const trimmedText = text.trim();
  return trimmedText === '' ? null : trimmedText;
}
