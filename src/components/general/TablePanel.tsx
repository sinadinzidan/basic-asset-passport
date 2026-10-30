import type { ReactNode } from 'react';

type TablePanelProps = {
  /** Search and filters, shown on top of the frame. */
  toolbar?: ReactNode;
  /** Pagination and summaries, shown under the content. */
  footer?: ReactNode;
  /** The table, or a loading, error or empty state. */
  children: ReactNode;
  'aria-label': string;
  'aria-busy'?: boolean;
};

export function TablePanel({ toolbar, footer, children, ...ariaProps }: TablePanelProps) {
  return (
    <section {...ariaProps} className="overflow-hidden rounded-lg border border-border">
      {toolbar && <div className="border-b border-border p-3">{toolbar}</div>}
      {children}
      {footer && <div className="border-t border-border bg-muted-background px-4 py-2">{footer}</div>}
    </section>
  );
}
