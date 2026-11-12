import {
  ASSISTANT_ERROR_DESCRIPTION,
  ASSISTANT_ERROR_TITLE,
  ASSISTANT_LOADING_MESSAGE,
  ASSISTANT_MISSING_MESSAGE,
} from '../../constants/agents';
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
          <LoadingNotice className="p-4" message={ASSISTANT_LOADING_MESSAGE} />
        ) : isError ? (
          <RetryAlert
            title={ASSISTANT_ERROR_TITLE}
            description={ASSISTANT_ERROR_DESCRIPTION}
            reason={errorReason}
            isRetrying={isRetrying}
            onRetry={retry}
          />
        ) : isMissing ? (
          <p className="agent-panel__empty">{ASSISTANT_MISSING_MESSAGE}</p>
        ) : null}
      </div>
    </>
  );
}
