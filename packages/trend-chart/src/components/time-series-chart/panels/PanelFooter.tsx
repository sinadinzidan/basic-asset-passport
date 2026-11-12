import type { ReactNode } from 'react';

export function PanelFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky -bottom-4 -mx-4 -mb-4 mt-auto border-t border-border bg-card-background p-3">
      {children}
    </div>
  );
}
