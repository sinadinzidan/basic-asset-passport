import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconMicrophone,
  IconPlayerStopFilled,
  IconSend,
} from '@tabler/icons-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import {
  ASSISTANT_NAME,
  DICTATION_FAILURE_MESSAGES,
  SAMPLE_QUESTIONS,
} from '../../constants/agents';
import { useAgentChatViewModel } from '../../hooks/agents/useAgentChatViewModel';
import { useSpeechDictation } from '../../hooks/agents/useSpeechDictation';
import { appendSpokenText } from '../../lib/appendSpokenText';
import { AppAlert } from '../general/AppAlert';
import { GeneralButton } from '../general/GeneralButton';

import { AgentMessage } from './AgentMessage';
import { AgentPanelClose } from './AgentPanelClose';
import { AgentThinking } from './AgentThinking';

type AgentChatProps = {
  onClose: () => void;
};

/** A chat with the chosen agent, answered through the CDF Agents API. */
export function AgentChat({ onClose }: AgentChatProps) {
  const {
    agent,
    messages,
    isSending,
    errorMessage,
    send,
    startNewChat,
  } = useAgentChatViewModel();
  const dictation = useSpeechDictation();
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message, or the thinking line, in view.
  useEffect(() => {
    const log = logRef.current;
    if (log !== null) log.scrollTop = log.scrollHeight;
  }, [messages.length, isSending]);

  if (agent === null) return null;

  const canSend = draft.trim() !== '' && !isSending;

  function submit(): void {
    if (!canSend) return;
    dictation.stop();
    setDraft('');
    void send(draft);
  }

  function toggleDictation(): void {
    const typedBefore = draft;
    dictation.toggle((spoken) =>
      setDraft(appendSpokenText(typedBefore, spoken)),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submit();
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setDraft(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <>
      <header className="agent-panel__header">
        <h2 className="agent-panel__title agent-panel__title--grow">
          {ASSISTANT_NAME}
        </h2>
        <GeneralButton
          disabled={messages.length === 0 || isSending}
          onClick={startNewChat}
          size="sm"
          variant="outline"
        >
          New chat
        </GeneralButton>
        <AgentPanelClose onClose={onClose} />
      </header>
      <div className="agent-panel__body agent-chat">
        <div
          ref={logRef}
          role="log"
          aria-label="Conversation"
          className="agent-chat__log"
        >
          {messages.length === 0 ? (
            <div className="agent-chat__welcome">
              <p className="agent-panel__empty">Ask {ASSISTANT_NAME} something.</p>
              <ul className="agent-chat__samples" aria-label="Sample questions">
                {SAMPLE_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      className="agent-chat__sample"
                      onClick={() => void send(question)}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((message) => (
              <AgentMessage key={message.id} message={message} />
            ))
          )}
          {isSending ? <AgentThinking /> : null}
        </div>
        {errorMessage !== null ? (
          <AppAlert variant="error" title="The agent could not answer">
            {errorMessage}
          </AppAlert>
        ) : null}
        {dictation.failure !== null ? (
          <AppAlert variant="error" title="Dictation stopped">
            {DICTATION_FAILURE_MESSAGES[dictation.failure]}
          </AppAlert>
        ) : null}
        <form className="agent-chat__form" onSubmit={handleSubmit}>
          <Textarea
            aria-label="Message"
            className="agent-chat__input"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question"
            rows={1}
            value={draft}
          />
          {dictation.isSupported ? (
            <GeneralButton
              aria-label={
                dictation.isListening ? 'Stop dictation' : 'Start dictation'
              }
              aria-pressed={dictation.isListening}
              className="agent-chat__mic"
              data-listening={dictation.isListening}
              onClick={toggleDictation}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              {dictation.isListening ? (
                <IconPlayerStopFilled aria-hidden className="size-4" />
              ) : (
                <IconMicrophone aria-hidden className="size-4" />
              )}
            </GeneralButton>
          ) : null}
          <GeneralButton disabled={!canSend} size="sm" type="submit">
            <IconSend aria-hidden className="size-4" />
            Send
          </GeneralButton>
        </form>
      </div>
    </>
  );
}
