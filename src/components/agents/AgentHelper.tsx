import { useState, type AnimationEvent, type KeyboardEvent } from 'react';

import { useAgentChatViewModel } from '../../hooks/agents/useAgentChatViewModel';

import { AgentChat } from './AgentChat';
import { AgentMascot } from './AgentMascot';
import { AgentPicker } from './AgentPicker';

type PanelPhase = 'CLOSED' | 'OPEN' | 'CLOSING';

/**
 * A floating helper in the bottom-left corner. Opening it grows a panel from
 * the corner, and the mascot flies up into the panel's header so the panel can
 * use the space it took. The panel chats, inside the app, with the one CDF agent
 * this app is built around (`FOCUSED_AGENT_EXTERNAL_ID`).
 */
export function AgentHelper() {
  const { agent, isSending } = useAgentChatViewModel();
  const [phase, setPhase] = useState<PanelPhase>('CLOSED');
  const isOpen = phase === 'OPEN';

  function toggle(): void {
    setPhase(isOpen ? 'CLOSING' : 'OPEN');
  }

  function close(): void {
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

  return (
    <div
      className="agent-helper"
      data-phase={phase}
      data-view={agent === null ? 'LIST' : 'CHAT'}
      onKeyDown={handleKeyDown}
    >
      {phase === 'CLOSED' ? null : (
        <section
          aria-label="AI assistant"
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
      <button
        aria-expanded={isOpen}
        aria-label="AI assistant"
        className="agent-helper__trigger"
        onClick={toggle}
        type="button"
      >
        <AgentMascot mood={isSending ? 'think' : 'idle'} />
      </button>
    </div>
  );
}
