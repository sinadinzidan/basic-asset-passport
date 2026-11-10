import { FOCUSED_AGENT_EXTERNAL_ID } from '../constants/agents';
import type { AgentClient, CdfAgent } from '../types/agent';

import { MOCK_LATENCY_MS, MOCK_PROJECT } from './mockAssetDataClient';

const MOCK_AGENTS: CdfAgent[] = [
  {
    externalId: FOCUSED_AGENT_EXTERNAL_ID,
    name: 'Asset Passport assistant',
    description: 'Answers questions about assets, their equipment, notes and documents.',
  },
];

/** Lists a dummy agent that answers with a fixed reply, so the helper works outside Fusion. */
export function makeMockAgentClient(
  latencyMs: number = MOCK_LATENCY_MS,
): AgentClient {
  let turnCount = 0;

  return {
    project: MOCK_PROJECT,
    getAgent: (externalId) =>
      after(
        latencyMs,
        () =>
          MOCK_AGENTS.find((agent) => agent.externalId === externalId) ?? null,
      ),
    chat: ({ agentExternalId, text }) =>
      after(latencyMs, () => {
        turnCount += 1;
        const name =
          MOCK_AGENTS.find((agent) => agent.externalId === agentExternalId)
            ?.name ?? agentExternalId;

        return {
          text: `${name} here. This is a dummy reply to "${text}": mock mode has no real agent behind it.`,
          cursor: `mock-cursor-${turnCount}`,
        };
      }),
  };
}

function after<T>(durationMs: number, produce: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(produce()), durationMs);
  });
}
