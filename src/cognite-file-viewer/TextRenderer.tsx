import { DefaultError, DefaultLoading } from './DefaultStates';
import type { CogniteFileViewerProps } from './types';
import { useTextContent } from './useTextContent';

export function TextRenderer({ url, renderLoading, renderError }: {
  url: string;
  renderLoading: CogniteFileViewerProps['renderLoading'];
  renderError: CogniteFileViewerProps['renderError'];
}) {
  const { content, isTruncated, error } = useTextContent(url);

  if (error) return renderError ? renderError(error) : <DefaultError error={error} />;
  if (content === null) return renderLoading ? renderLoading() : <DefaultLoading />;

  return (
    <>
      {isTruncated && <p role="note" className="border-b border-border bg-muted-background px-4 py-2 text-xs text-muted-foreground">This file is large, so only the first part is shown.</p>}
      <pre className="m-0 overflow-auto p-4 font-mono text-sm leading-normal break-words whitespace-pre-wrap">{content}</pre>
    </>
  );
}
