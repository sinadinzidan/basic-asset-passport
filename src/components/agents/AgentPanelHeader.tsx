import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { ASSISTANT_NAME } from '../../constants/agents';
import { GeneralButton } from '../general/GeneralButton';

type AgentPanelHeaderProps = {
  onClose: () => void;
  children?: ReactNode;
};

export function AgentPanelHeader({ onClose, children }: AgentPanelHeaderProps) {
  return (
    <header className="agent-panel__header">
      <h2 className="agent-panel__title">{ASSISTANT_NAME}</h2>
      {children}
      <GeneralButton
        aria-label="Close assistant"
        onClick={onClose}
        size="icon-sm"
        variant="outline"
      >
        <IconX aria-hidden className="size-4" />
      </GeneralButton>
    </header>
  );
}
