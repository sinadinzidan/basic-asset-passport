import type { AgentContextType, CdfAgent } from '../types/agent';

export function makeCdfAgent(overrides: Partial<CdfAgent> = {}): CdfAgent {
  return {
    externalId: 'cooling-expert',
    name: 'Cooling expert',
    description: 'Answers questions about cooling systems.',
    ...overrides,
  };
}

export function makeAgentContext(overrides: Partial<AgentContextType> = {}): AgentContextType {
  return {
    project: 'my-project',
    getAgent: () => Promise.resolve(makeCdfAgent()),
    chat: () => Promise.resolve({ text: 'Hello!', cursor: 'cursor-1' }),
    ...overrides,
  };
}
