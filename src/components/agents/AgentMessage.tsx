import { IconCheck, IconCopy, IconCopyOff, type Icon } from '@tabler/icons-react';

import { ChatMessageRole } from '../../enums/chatMessageRole';
import { CopyStatus } from '../../enums/copyStatus';
import { useCopyToClipboard } from '../../hooks/general/useCopyToClipboard';
import { cn } from '../../lib/utils';
import type { ChatMessage } from '../../types/agent';
import { IconActionButton } from '../general/IconActionButton';

type AgentMessageProps = {
  message: ChatMessage;
};

const COPY_LABELS: Record<CopyStatus, string> = {
  IDLE: 'Copy response',
  COPIED: 'Copied',
  FAILED: 'Could not copy',
};

const COPY_ICONS: Record<CopyStatus, Icon> = {
  IDLE: IconCopy,
  COPIED: IconCheck,
  FAILED: IconCopyOff,
};

export function AgentMessage({ message }: AgentMessageProps) {
  const { status, copy } = useCopyToClipboard();

  const CopyIcon = COPY_ICONS[status];

  function handleCopyClick(): void {
    void copy(message.text);
  }

  return (
    <div className="agent-chat__message" data-role={message.role}>
      <p className="agent-chat__text">{message.text}</p>
      {message.role === ChatMessageRole.AGENT ? (
        <IconActionButton
          className={cn(
            'agent-chat__copy',
            status === CopyStatus.COPIED && 'agent-chat__copy--copied',
          )}
          icon={<CopyIcon aria-hidden className="size-4" />}
          label={COPY_LABELS[status]}
          onClick={handleCopyClick}
        />
      ) : null}
    </div>
  );
}
