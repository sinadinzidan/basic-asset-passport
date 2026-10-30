import { Button } from '@cognite/aura/components/button';

/** An asset's name as the button that opens it, or as plain text when it cannot be opened. */
export function AssetName({ name, onOpen }: { name: string; onOpen?: () => void }) {
  if (!onOpen) return <span className="font-medium wrap-anywhere">{name}</span>;
  return (
    <Button variant="ghost" className="-ml-3 h-auto max-w-full text-left whitespace-normal" aria-label={`Open ${name}`}
      onClick={(event) => { event.stopPropagation(); onOpen(); }}>
      <span className="py-1 wrap-anywhere">{name}</span>
    </Button>
  );
}
