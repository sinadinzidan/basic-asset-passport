import { Toaster } from '@cognite/aura/components/sonner-toast';
import type { CSSProperties, ReactNode } from 'react';

import { GRID_TRACES } from '../../constants/gridTraces';
import type { GridTrace } from '../../types/gridTrace';

type NeonStageProps = {
  children: ReactNode;
};

type TraceStyle = CSSProperties & Record<`--${string}`, string | number>;

export function NeonStage({ children }: NeonStageProps) {
  return (
    <div className="neon-stage text-base-foreground">
      <div className="neon-traces" aria-hidden>
        {GRID_TRACES.map((trace) => (
          <span
            key={`${trace.axis}-${trace.line}-${trace.from}`}
            className="neon-trace"
            data-axis={trace.axis}
            style={toTraceStyle(trace)}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
      <Toaster />
    </div>
  );
}

function toTraceStyle(trace: GridTrace): TraceStyle {
  return {
    '--trace-line': trace.line,
    '--trace-from': trace.from,
    '--trace-to': trace.to,
    animationDuration: `${trace.durationSeconds}s`,
    animationDelay: `${trace.delaySeconds}s`,
  };
}
