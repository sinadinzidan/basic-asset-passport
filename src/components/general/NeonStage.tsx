import type { ReactNode } from 'react';

type NeonStageProps = {
  children: ReactNode;
};

export function NeonStage({ children }: NeonStageProps) {
  return (
    <div className="neon-stage text-base-foreground">
      <div className="neon-orb neon-orb--cyan" aria-hidden />
      <div className="neon-orb neon-orb--sky" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
