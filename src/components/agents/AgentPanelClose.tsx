import { IconX } from '@tabler/icons-react';

import { GeneralButton } from '../general/GeneralButton';

type AgentPanelCloseProps = {
  onClose: () => void;
};

export function AgentPanelClose({ onClose }: AgentPanelCloseProps) {
  return (
    <GeneralButton
      aria-label="Close agents"
      onClick={onClose}
      size="icon-sm"
      variant="outline"
    >
      <IconX aria-hidden className="size-4" />
    </GeneralButton>
  );
}
