/** The confirmation shown after documents were uploaded. */
export function formatDocumentsUploadedMessage(count: number): string {
  return count === 1 ? '1 document uploaded.' : `${count} documents uploaded.`;
}
