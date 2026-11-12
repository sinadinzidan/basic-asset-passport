import type { ReactNode } from 'react';

interface PanelSectionProperties {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function PanelSection({ title, description, action, children }: PanelSectionProperties) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          {action}
        </div>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
