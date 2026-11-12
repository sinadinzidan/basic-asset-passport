import type { AgentContextType } from '../types/agent';

import { MOCK_PROJECT } from './mockAssetContext';

export const MOCK_AGENT_UNAVAILABLE_MESSAGE = 'The assistant is not available in mock mode.';

export function makeMockAgentContext(): AgentContextType {
  return {
    project: MOCK_PROJECT,
    getAgent: () => Promise.resolve(null),
    chat: () => Promise.reject(new Error(MOCK_AGENT_UNAVAILABLE_MESSAGE)),
  };
}
