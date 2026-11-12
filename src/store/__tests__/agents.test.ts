import { describe, expect, it } from 'vitest';

import { ChatMessageRole } from '../../enums/chatMessageRole';
import { makeCdfAgent } from '../../mocks/agents';
import {
  createAgentChatStore,
  EMPTY_CONVERSATION,
  getConversation,
  INITIAL_AGENT_CHAT_STATE,
} from '../agents';

const agent = makeCdfAgent();
const userMessage = { id: 'm1', role: ChatMessageRole.USER, text: 'Hi' };
const agentMessage = { id: 'm2', role: ChatMessageRole.AGENT, text: 'Hello' };

describe(createAgentChatStore.name, () => {
  it('starts with no agent chosen and no conversations', () => {
    const store = createAgentChatStore();

    expect(store.getState().selectedAgent).toBeNull();
    expect(getConversation(store.getState(), agent.externalId)).toEqual(EMPTY_CONVERSATION);
  });

  it('starts from the state it is given', () => {
    const store = createAgentChatStore({ ...INITIAL_AGENT_CHAT_STATE, selectedAgent: agent });

    expect(store.getState().selectedAgent).toEqual(agent);
  });

  it('keeps one store apart from another', () => {
    const first = createAgentChatStore();
    const second = createAgentChatStore();

    first.getState().selectAgent(agent);

    expect(second.getState().selectedAgent).toBeNull();
  });

  it('chooses an agent and can go back to none', () => {
    const store = createAgentChatStore();

    store.getState().selectAgent(agent);
    expect(store.getState().selectedAgent).toEqual(agent);

    store.getState().selectAgent(null);
    expect(store.getState().selectedAgent).toBeNull();
  });

  it('adds the question and marks the conversation as waiting', () => {
    const store = createAgentChatStore();

    store.getState().addUserMessage(agent.externalId, userMessage);

    expect(getConversation(store.getState(), agent.externalId)).toEqual({
      messages: [userMessage],
      cursor: null,
      isSending: true,
      errorMessage: null,
    });
  });

  it('adds the reply, remembers the cursor and stops waiting', () => {
    const store = askedStore();

    store.getState().receiveReply(agent.externalId, agentMessage, 'cursor-1');

    expect(getConversation(store.getState(), agent.externalId)).toEqual({
      messages: [userMessage, agentMessage],
      cursor: 'cursor-1',
      isSending: false,
      errorMessage: null,
    });
  });

  it('keeps the earlier cursor when the reply has none', () => {
    const store = askedStore();
    store.getState().receiveReply(agent.externalId, agentMessage, 'cursor-1');
    store.getState().addUserMessage(agent.externalId, userMessage);

    store.getState().receiveReply(agent.externalId, agentMessage, null);

    expect(getConversation(store.getState(), agent.externalId).cursor).toBe('cursor-1');
  });

  it('records why the agent did not answer and stops waiting', () => {
    const store = askedStore();

    store.getState().failSend(agent.externalId, 'forbidden');

    const conversation = getConversation(store.getState(), agent.externalId);
    expect(conversation.isSending).toBe(false);
    expect(conversation.errorMessage).toBe('forbidden');
    expect(conversation.messages).toEqual([userMessage]);
  });

  it('clears the error when the next question is sent', () => {
    const store = askedStore();
    store.getState().failSend(agent.externalId, 'forbidden');

    store.getState().addUserMessage(agent.externalId, userMessage);

    expect(getConversation(store.getState(), agent.externalId).errorMessage).toBeNull();
  });

  it('waits again with the same messages when the question is asked again', () => {
    const store = askedStore();
    store.getState().failSend(agent.externalId, 'forbidden');

    store.getState().retrySend(agent.externalId);

    const conversation = getConversation(store.getState(), agent.externalId);
    expect(conversation.isSending).toBe(true);
    expect(conversation.errorMessage).toBeNull();
    expect(conversation.messages).toEqual([userMessage]);
  });

  it('starts a conversation over without touching the others', () => {
    const store = askedStore();
    store.getState().addUserMessage('other', userMessage);

    store.getState().resetConversation(agent.externalId);

    expect(getConversation(store.getState(), agent.externalId)).toEqual(EMPTY_CONVERSATION);
    expect(getConversation(store.getState(), 'other').messages).toEqual([userMessage]);
  });

  it('gives the same empty conversation each time, so a selector on it stays stable', () => {
    const state = createAgentChatStore().getState();

    expect(getConversation(state, 'a')).toBe(getConversation(state, 'b'));
  });
});

function askedStore() {
  const store = createAgentChatStore();
  store.getState().addUserMessage(agent.externalId, userMessage);
  return store;
}
