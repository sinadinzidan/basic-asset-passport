import { createContext, useCallback, useContext } from 'react';

import type { CdfAgent, ChatMessage } from '../../types/agent';

import { getConversation } from './agentChatReducer';
import { useAgentChatState } from './useAgentChatState';
import { useAgentClient } from './useAgentClient';

const defaultDeps = {
  useAgentClient,
  createMessageId: (): string => crypto.randomUUID(),
};

export type UseAgentChatViewModelContextType = typeof defaultDeps;
export const UseAgentChatViewModelContext =
  createContext<UseAgentChatViewModelContextType>(defaultDeps);

export type AgentChatViewModel = {
  agent: CdfAgent | null;
  messages: ChatMessage[];
  isSending: boolean;
  errorMessage: string | null;
  send: (text: string) => Promise<void>;
  startNewChat: () => void;
};

export function useAgentChatViewModel(): AgentChatViewModel {
  const { useAgentClient: useClient, createMessageId } = useContext(
    UseAgentChatViewModelContext,
  );
  const client = useClient();
  const { state, dispatch } = useAgentChatState();
  const agent = state.selectedAgent;
  const conversation = getConversation(state, agent?.externalId ?? '');

  const send = useCallback(
    async (text: string): Promise<void> => {
      const question = text.trim();
      if (agent === null || question === '' || conversation.isSending) return;

      const agentExternalId = agent.externalId;
      dispatch({
        type: 'MESSAGE_SENT',
        agentExternalId,
        message: { id: createMessageId(), role: 'USER', text: question },
      });

      try {
        const reply = await client.chat({
          agentExternalId,
          text: question,
          cursor: conversation.cursor,
        });
        dispatch({
          type: 'REPLY_RECEIVED',
          agentExternalId,
          message: { id: createMessageId(), role: 'AGENT', text: reply.text },
          cursor: reply.cursor,
        });
      } catch (error) {
        dispatch({
          type: 'SEND_FAILED',
          agentExternalId,
          errorMessage:
            error instanceof Error ? error.message : 'Try again in a moment.',
        });
      }
    },
    [
      agent,
      client,
      conversation.cursor,
      conversation.isSending,
      createMessageId,
      dispatch,
    ],
  );

  const startNewChat = useCallback(() => {
    if (agent === null) return;
    dispatch({ type: 'CONVERSATION_RESET', agentExternalId: agent.externalId });
  }, [agent, dispatch]);

  return {
    agent,
    messages: conversation.messages,
    isSending: conversation.isSending,
    errorMessage: conversation.errorMessage,
    send,
    startNewChat,
  };
}
