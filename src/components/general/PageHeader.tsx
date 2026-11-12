import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  kicker?: string;
  description?: string;
  leading?: ReactNode;
  badges?: ReactNode;
};

export function PageHeader({ title, kicker, description, leading, badges }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {kicker ? (
        <div className="label-row">
          <span aria-hidden className="hud-dot" />
          <span className="hud-kicker">{kicker}</span>
          <span aria-hidden className="label-row__rule" />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {leading}
        <h1 className="page-title min-w-0 break-words">{title}</h1>
        {badges ? <div className="ml-auto flex flex-wrap items-center gap-2">{badges}</div> : null}
      </div>
      {description ? (
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
