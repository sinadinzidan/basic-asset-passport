import type { ReactNode } from 'react';

type PageHeaderProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ icon, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      {icon && <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl p-3.5 text-foreground [background-image:var(--gradient-aurora)] [&_svg]:size-7" aria-hidden>{icon}</div>}
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-3xl font-semibold wrap-anywhere">{title}</h1>
        {description && <p className="max-w-150 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
