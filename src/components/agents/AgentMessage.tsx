import { IconCheck, IconCopy, IconCopyOff } from '@tabler/icons-react';

import { useCopyToClipboard } from '../../hooks/agents/useCopyToClipboard';
import type { ChatMessage } from '../../types/agent';

type AgentMessageProps = {
  message: ChatMessage;
};

const COPY_LABELS = {
  IDLE: 'Copy response',
  COPIED: 'Copied',
  FAILED: 'Could not copy',
} as const;

/** One message of the conversation; the agent's replies can be copied. */
export function AgentMessage({ message }: AgentMessageProps) {
  const { status, copy } = useCopyToClipboard();

  return (
    <div className="agent-chat__message" data-role={message.role}>
      <p className="agent-chat__text">{message.text}</p>
      {message.role === 'AGENT' ? (
        <button
          type="button"
          aria-label={COPY_LABELS[status]}
          className="agent-chat__copy"
          data-status={status}
          onClick={() => void copy(message.text)}
          title={COPY_LABELS[status]}
        >
          {status === 'COPIED' ? (
            <IconCheck aria-hidden className="size-3.5" />
          ) : status === 'FAILED' ? (
            <IconCopyOff aria-hidden className="size-3.5" />
          ) : (
            <IconCopy aria-hidden className="size-3.5" />
          )}
        </button>
      ) : null}
    </div>
  );
}
