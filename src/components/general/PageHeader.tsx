import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  leading?: ReactNode;
  badges?: ReactNode;
};

export function PageHeader({
  title,
  description,
  leading,
  badges,
}: PageHeaderProps) {
  return (
    <div className="page-enter flex flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {leading}
        <h1 className="font-display min-w-0 break-words text-2xl font-semibold sm:text-3xl">
          {title}
        </h1>
        {badges ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {badges}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
