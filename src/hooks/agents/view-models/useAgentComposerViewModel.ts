import { useState } from 'react';

import { appendSpokenText } from '../../../lib/appendSpokenText';
import { useSpeechDictation } from '../../general/useSpeechDictation';

import { useAgentChatViewModel } from './useAgentChatViewModel';

export function useAgentComposerViewModel() {
  const { messages, isSending, errorMessage, send, retry, startNewChat } = useAgentChatViewModel();
  const dictation = useSpeechDictation();

  const [draft, setDraft] = useState('');

  const canSend = draft.trim() !== '' && !isSending;
  const canStartNewChat = messages.length > 0 && !isSending;

  function submit(): void {
    if (!canSend) return;

    dictation.cancel();
    setDraft('');
    void send(draft);
  }

  function changeDraft(text: string): void {
    dictation.cancel();
    setDraft(text);
  }

  function toggleDictation(): void {
    const typedBefore = draft;

    dictation.toggle((spoken) => setDraft(appendSpokenText(typedBefore, spoken)));
  }

  function sendSample(question: string): void {
    void send(question);
  }

  function retrySend(): void {
    void retry();
  }

  return {
    messages,
    isSending,
    errorMessage,
    draft,
    canSend,
    canStartNewChat,
    dictation: {
      isSupported: dictation.isSupported,
      isListening: dictation.isListening,
      failure: dictation.failure,
    },
    submit,
    changeDraft,
    toggleDictation,
    sendSample,
    retrySend,
    startNewChat,
  };
}
