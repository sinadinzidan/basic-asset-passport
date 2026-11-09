const NOTE_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatNoteDate(timestampMs: number): string {
  return NOTE_DATE_FORMAT.format(new Date(timestampMs));
}
