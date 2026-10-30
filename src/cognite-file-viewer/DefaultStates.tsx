export function DefaultLoading() {
  return <div className="p-4 text-muted-foreground">Loading file…</div>;
}

export function DefaultError({ error }: { error: Error }) {
  return (
    <div className="p-4 text-destructive-foreground-on-critical">
      Failed to load file: {error.message}
    </div>
  );
}

export function DefaultUnsupported({ mimeType }: { mimeType: string | undefined }) {
  return (
    <div className="p-4 text-muted-foreground">
      Unsupported file type{mimeType ? `: ${mimeType}` : ''}
    </div>
  );
}
