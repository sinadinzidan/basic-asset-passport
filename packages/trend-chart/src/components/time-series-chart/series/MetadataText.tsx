import { NOT_AVAILABLE_TEXT } from './seriesCopy';

export function MetadataText({ value }: { value: string | undefined }) {
  const text = value?.trim();
  if (!text) return <span className="text-muted-foreground">{NOT_AVAILABLE_TEXT}</span>;
  return <>{text}</>;
}
