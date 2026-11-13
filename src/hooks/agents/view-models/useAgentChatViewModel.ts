import { createContext, useCallback, useContext } from 'react';

import { SEND_FAILED_FALLBACK_MESSAGE } from '../../../constants/agents';
import { ChatMessageRole } from '../../../enums/chatMessageRole';
import { getConversation } from '../../../store/agents';
import type { CdfAgent, ChatMessage } from '../../../types/agent';
import { useAgentClient } from '../useAgentClient';
import { useAgentConversation } from '../useAgentConversation';
import { useDalilAgent } from '../useDalilAgent';

const defaultDeps = {
  createMessageId: (): string => crypto.randomUUID(),
};

export type UseAgentChatViewModelContextType = typeof defaultDeps;
export const UseAgentChatViewModelContext =
  createContext<UseAgentChatViewModelContextType>(defaultDeps);

type AgentChatViewModel = {
  agent: CdfAgent | null;
  messages: ChatMessage[];
  isSending: boolean;
  errorMessage: string | null;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  startNewChat: () => void;
};

export function useAgentChatViewModel(): AgentChatViewModel {
  const { createMessageId } = useContext(UseAgentChatViewModelContext);
  const client = useAgentClient();
  const { data: focusedAgent } = useDalilAgent(false);
  const conversation = useAgentConversation((store) =>
    getConversation(store, focusedAgent?.externalId ?? ''),
  );
  const addUserMessage = useAgentConversation((store) => store.addUserMessage);
  const receiveReply = useAgentConversation((store) => store.receiveReply);
  const failSend = useAgentConversation((store) => store.failSend);
  const retrySend = useAgentConversation((store) => store.retrySend);
  const resetConversation = useAgentConversation((store) => store.resetConversation);

  const agent = focusedAgent ?? null;

  const ask = useCallback(
    async (agentExternalId: string, question: string): Promise<void> => {
      try {
        const reply = await client.chat({
          agentExternalId,
          text: question,
          cursor: conversation.cursor,
        });

        receiveReply(
          agentExternalId,
          { id: createMessageId(), role: ChatMessageRole.AGENT, text: reply.text },
          reply.cursor,
        );
      } catch (error) {
        failSend(
          agentExternalId,
          error instanceof Error ? error.message : SEND_FAILED_FALLBACK_MESSAGE,
        );
      }
    },
    [client, conversation.cursor, createMessageId, failSend, receiveReply],
  );

  const send = useCallback(
    async (text: string): Promise<void> => {
      const question = text.trim();

      if (agent === null || question === '' || conversation.isSending) return;

      addUserMessage(agent.externalId, {
        id: createMessageId(),
        role: ChatMessageRole.USER,
        text: question,
      });
      await ask(agent.externalId, question);
    },
    [addUserMessage, agent, ask, conversation.isSending, createMessageId],
  );

  const retry = useCallback(async (): Promise<void> => {
    const unanswered = conversation.messages[conversation.messages.length - 1];

    if (agent === null || conversation.errorMessage === null || conversation.isSending) return;

    if (unanswered?.role !== ChatMessageRole.USER) return;

    retrySend(agent.externalId);
    await ask(agent.externalId, unanswered.text);
  }, [agent, ask, conversation, retrySend]);

  const startNewChat = useCallback(() => {
    if (agent === null) return;

    resetConversation(agent.externalId);
  }, [agent, resetConversation]);

  return {
    agent,
    messages: conversation.messages,
    isSending: conversation.isSending,
    errorMessage: conversation.errorMessage,
    send,
    retry,
    startNewChat,
  };
}
