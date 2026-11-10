import { useAgentPickerViewModel } from '../../hooks/agents/useAgentPickerViewModel';
import { LoadingNotice } from '../general/LoadingNotice';
import { RetryAlert } from '../general/RetryAlert';

import { AgentPanelClose } from './AgentPanelClose';

type AgentPickerProps = {
  onClose: () => void;
};

/**
 * Shown until the helper's agent has been found in the project; it then gives
 * way to the chat. It only appears to say the agent is loading or unavailable.
 */
export function AgentPicker({ onClose }: AgentPickerProps) {
  const { isLoading, isError, isRetrying, isMissing, retry } =
    useAgentPickerViewModel();

  return (
    <>
      <header className="agent-panel__header">
        <h2 className="agent-panel__title agent-panel__title--grow">
          AI assistant
        </h2>
        <AgentPanelClose onClose={onClose} />
      </header>
      <div className="agent-panel__body">
        {isLoading ? (
          <LoadingNotice className="p-4" message="Loading assistant..." />
        ) : isError ? (
          <RetryAlert
            title="The assistant could not be loaded"
            description="Check access to the agents of this project, then try again."
            isRetrying={isRetrying}
            onRetry={retry}
          />
        ) : isMissing ? (
          <p className="agent-panel__empty">
            The assistant is not available in this project.
          </p>
        ) : null}
      </div>
    </>
  );
}
