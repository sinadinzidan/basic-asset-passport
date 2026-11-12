import { useAgentStatusViewModel } from '../../hooks/agents/useAgentStatusViewModel';
import { LoadingNotice } from '../general/LoadingNotice';
import { RetryAlert } from '../general/RetryAlert';

import { AgentPanelHeader } from './AgentPanelHeader';

type AgentStatusProps = {
  onClose: () => void;
};

export function AgentStatus({ onClose }: AgentStatusProps) {
  const { isLoading, isError, errorReason, isRetrying, isMissing, retry } =
    useAgentStatusViewModel();

  return (
    <>
      <AgentPanelHeader onClose={onClose} />
      <div className="agent-panel__body">
        {isLoading ? (
          <LoadingNotice className="p-4" message="Loading assistant..." />
        ) : isError ? (
          <RetryAlert
            title="The assistant could not be loaded"
            description="Check access to the agents of this project, then try again."
            reason={errorReason}
            isRetrying={isRetrying}
            onRetry={retry}
          />
        ) : isMissing ? (
          <p className="agent-panel__empty">The assistant is not available in this project.</p>
        ) : null}
      </div>
    </>
  );
}
