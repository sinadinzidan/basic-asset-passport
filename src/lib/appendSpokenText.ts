export function appendSpokenText(draft: string, spoken: string): string {
  const words = spoken.trim();
  if (words === '') return draft;
  if (draft === '' || /\s$/.test(draft)) return `${draft}${words}`;

  return `${draft} ${words}`;
}
