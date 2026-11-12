import { AgentMascot, AgentMood } from '@adnoc/agent-mascot';
import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { useEffect, useRef, type AnimationEvent, type KeyboardEvent } from 'react';

import {
  ASSISTANT_GREETING,
  ASSISTANT_LABEL,
  GREETING_HOVER_DELAY_MS,
} from '../../constants/agents';
import { ESCAPE_KEY } from '../../constants/keyboard';
import { AgentPanelView } from '../../enums/agentPanelView';
import { PanelPhase } from '../../enums/panelPhase';
import { useAgentHelperViewModel } from '../../hooks/agents/useAgentHelperViewModel';

import { AgentChat } from './AgentChat';
import { AgentStatus } from './AgentStatus';

export function AgentHelper() {
  const {
    agent,
    isSending,
    phase,
    isOpen,
    isGreeting,
    toggle,
    close,
    closeIfOpen,
    finishClosing,
    changeGreetingOpen,
    keepIntroGreeting,
  } = useAgentHelperViewModel();

  const panelReference = useRef<HTMLElement>(null);
  const triggerReference = useRef<HTMLButtonElement>(null);
  const wasOpenReference = useRef(isOpen);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === ESCAPE_KEY) closeIfOpen();
  }
  function handleAnimationEnd(event: AnimationEvent<HTMLElement>): void {
    if (event.target === event.currentTarget) finishClosing();
  }

  useEffect(() => {
    if (isOpen === wasOpenReference.current) return;
    wasOpenReference.current = isOpen;
    (isOpen ? panelReference : triggerReference).current?.focus();
  }, [isOpen]);

  return (
    <div
      className="agent-helper"
      data-greeting={isGreeting}
      data-phase={phase}
      data-view={agent === null ? AgentPanelView.STATUS : AgentPanelView.CHAT}
      onKeyDown={handleKeyDown}
    >
      {phase === PanelPhase.CLOSED ? null : (
        <section
          ref={panelReference}
          aria-label={ASSISTANT_LABEL}
          aria-modal="false"
          className="agent-panel"
          data-phase={phase}
          onAnimationEnd={handleAnimationEnd}
          role="dialog"
          tabIndex={-1}
        >
          {agent === null ? <AgentStatus onClose={close} /> : <AgentChat onClose={close} />}
        </section>
      )}
      <Tooltip disableHoverableContent onOpenChange={changeGreetingOpen} open={isGreeting}>
        <TooltipTrigger
          data-slot="agent-helper-trigger"
          delay={GREETING_HOVER_DELAY_MS}
          render={
            <Button
              ref={triggerReference}
              aria-expanded={isOpen}
              aria-label={ASSISTANT_LABEL}
              className="agent-helper__trigger agent-mascot-wave-on-hover"
              onClick={toggle}
              onPointerEnter={keepIntroGreeting}
              variant="ghost"
            >
              <AgentMascot
                mood={isSending ? AgentMood.THINKING : AgentMood.IDLE}
                isWaving={isGreeting}
              />
            </Button>
          }
        />
        <TooltipContent align="start" className="agent-greeting" side="right">
          {ASSISTANT_GREETING}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
