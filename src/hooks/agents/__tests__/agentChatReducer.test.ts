import { describe, expect, it } from 'vitest';

import { makeCdfAgent } from '../../../mocks/agents';
import {
  agentChatReducer,
  EMPTY_CONVERSATION,
  getConversation,
  INITIAL_AGENT_CHAT_STATE,
  type AgentChatState,
} from '../agentChatReducer';

const agent = makeCdfAgent();
const userMessage = { id: 'm1', role: 'USER', text: 'Hi' } as const;
const agentMessage = { id: 'm2', role: 'AGENT', text: 'Hello' } as const;

describe(agentChatReducer.name, () => {
  it('starts with no agent chosen and no conversations', () => {
    expect(INITIAL_AGENT_CHAT_STATE.selectedAgent).toBeNull();
    expect(getConversation(INITIAL_AGENT_CHAT_STATE, 'cooling-expert')).toEqual(
      EMPTY_CONVERSATION,
    );
  });

  it('chooses an agent and can go back to the list', () => {
    const chosen = agentChatReducer(INITIAL_AGENT_CHAT_STATE, {
      type: 'AGENT_SELECTED',
      agent,
    });
    const back = agentChatReducer(chosen, {
      type: 'AGENT_SELECTED',
      agent: null,
    });

    expect(chosen.selectedAgent).toEqual(agent);
    expect(back.selectedAgent).toBeNull();
  });

  it('adds the question and marks the conversation as waiting', () => {
    const state = agentChatReducer(INITIAL_AGENT_CHAT_STATE, {
      type: 'MESSAGE_SENT',
      agentExternalId: agent.externalId,
      message: userMessage,
    });

    expect(getConversation(state, agent.externalId)).toEqual({
      messages: [userMessage],
      cursor: null,
      isSending: true,
      errorMessage: null,
    });
  });

  it('adds the reply, remembers the cursor and stops waiting', () => {
    const asked = ask(INITIAL_AGENT_CHAT_STATE);

    const state = agentChatReducer(asked, {
      type: 'REPLY_RECEIVED',
      agentExternalId: agent.externalId,
      message: agentMessage,
      cursor: 'cursor-1',
    });

    expect(getConversation(state, agent.externalId)).toEqual({
      messages: [userMessage, agentMessage],
      cursor: 'cursor-1',
      isSending: false,
      errorMessage: null,
    });
  });

  it('keeps the earlier cursor when the reply has none', () => {
    const state = [
      ask,
      (current: AgentChatState) =>
        agentChatReducer(current, {
          type: 'REPLY_RECEIVED',
          agentExternalId: agent.externalId,
          message: agentMessage,
          cursor: 'cursor-1',
        }),
      ask,
      (current: AgentChatState) =>
        agentChatReducer(current, {
          type: 'REPLY_RECEIVED',
          agentExternalId: agent.externalId,
          message: agentMessage,
          cursor: null,
        }),
    ].reduce((current, step) => step(current), INITIAL_AGENT_CHAT_STATE);

    expect(getConversation(state, agent.externalId).cursor).toBe('cursor-1');
  });

  it('records why the agent did not answer and stops waiting', () => {
    const state = agentChatReducer(ask(INITIAL_AGENT_CHAT_STATE), {
      type: 'SEND_FAILED',
      agentExternalId: agent.externalId,
      errorMessage: 'forbidden',
    });

    const conversation = getConversation(state, agent.externalId);
    expect(conversation.isSending).toBe(false);
    expect(conversation.errorMessage).toBe('forbidden');
    expect(conversation.messages).toEqual([userMessage]);
  });

  it('clears the error when the next question is sent', () => {
    const failed = agentChatReducer(ask(INITIAL_AGENT_CHAT_STATE), {
      type: 'SEND_FAILED',
      agentExternalId: agent.externalId,
      errorMessage: 'forbidden',
    });

    expect(
      getConversation(ask(failed), agent.externalId).errorMessage,
    ).toBeNull();
  });

  it('starts a conversation over without touching the others', () => {
    const other = agentChatReducer(INITIAL_AGENT_CHAT_STATE, {
      type: 'MESSAGE_SENT',
      agentExternalId: 'other',
      message: userMessage,
    });
    const both = ask(other);

    const state = agentChatReducer(both, {
      type: 'CONVERSATION_RESET',
      agentExternalId: agent.externalId,
    });

    expect(getConversation(state, agent.externalId)).toEqual(
      EMPTY_CONVERSATION,
    );
    expect(getConversation(state, 'other').messages).toEqual([userMessage]);
  });
});

function ask(state: AgentChatState): AgentChatState {
  return agentChatReducer(state, {
    type: 'MESSAGE_SENT',
    agentExternalId: agent.externalId,
    message: userMessage,
  });
}
