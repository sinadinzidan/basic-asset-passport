import type { ReactNode } from 'react';

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-6 text-base-foreground sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">{children}</div>
    </main>
  );
}
