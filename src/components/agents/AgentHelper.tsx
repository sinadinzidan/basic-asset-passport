import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cognite/aura/components/tooltip';
import { useState, type AnimationEvent, type KeyboardEvent } from 'react';

import {
  ASSISTANT_GREETING,
  ASSISTANT_LABEL,
  GREETING_HOVER_DELAY_MS,
} from '../../constants/agents';
import { useAgentChatViewModel } from '../../hooks/agents/useAgentChatViewModel';
import { useAgentGreeting } from '../../hooks/agents/useAgentGreeting';

import { AgentChat } from './AgentChat';
import { AgentMascot } from './AgentMascot';
import { AgentPicker } from './AgentPicker';

type PanelPhase = 'CLOSED' | 'OPEN' | 'CLOSING';

/** The assistant's mascot in the corner of the app, and the chat panel it opens. */
export function AgentHelper() {
  const { agent, isSending } = useAgentChatViewModel();
  const { isIntroShown, dismissIntro } = useAgentGreeting();

  const [phase, setPhase] = useState<PanelPhase>('CLOSED');
  const [isPointedAt, setIsPointedAt] = useState(false);

  const isOpen = phase === 'OPEN';
  // The mascot says who it is while it is pointed at or focused, and once by itself when the app opens.
  const isGreeting = phase === 'CLOSED' && (isIntroShown || isPointedAt);

  function stopGreeting(): void {
    setIsPointedAt(false);
    dismissIntro();
  }
  function toggle(): void {
    stopGreeting();
    setPhase(isOpen ? 'CLOSING' : 'OPEN');
  }
  function close(): void {
    stopGreeting();
    setPhase('CLOSING');
  }
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape' && isOpen) close();
  }
  // The exit animation is what unmounts the panel, so it can fade out first.
  function handleAnimationEnd(event: AnimationEvent<HTMLElement>): void {
    if (event.target === event.currentTarget && phase === 'CLOSING') {
      setPhase('CLOSED');
    }
  }
  function handleGreetingOpenChange(isGreetingOpen: boolean): void {
    setIsPointedAt(isGreetingOpen);
    if (!isGreetingOpen) dismissIntro();
  }
  // A pointer that arrives during the first greeting keeps it up for as long as it stays.
  function handlePointerEnter(): void {
    if (isIntroShown) setIsPointedAt(true);
  }

  return (
    <div
      className="agent-helper"
      data-greeting={isGreeting}
      data-phase={phase}
      data-view={agent === null ? 'LIST' : 'CHAT'}
      onKeyDown={handleKeyDown}
    >
      {phase === 'CLOSED' ? null : (
        <section
          aria-label={ASSISTANT_LABEL}
          className="agent-panel"
          data-phase={phase}
          onAnimationEnd={handleAnimationEnd}
          role="dialog"
        >
          {agent === null ? (
            <AgentPicker onClose={close} />
          ) : (
            <AgentChat onClose={close} />
          )}
        </section>
      )}
      <Tooltip
        disableHoverableContent
        onOpenChange={handleGreetingOpenChange}
        open={isGreeting}
      >
        <TooltipTrigger
          data-slot="agent-helper-trigger"
          delay={GREETING_HOVER_DELAY_MS}
          render={
            <button
              aria-expanded={isOpen}
              aria-label={ASSISTANT_LABEL}
              className="agent-helper__trigger"
              onClick={toggle}
              onPointerEnter={handlePointerEnter}
              type="button"
            >
              <AgentMascot mood={isSending ? 'think' : 'idle'} />
            </button>
          }
        />
        <TooltipContent align="start" className="agent-greeting" side="right">
          {ASSISTANT_GREETING}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
