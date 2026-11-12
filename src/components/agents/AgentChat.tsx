import { Textarea } from '@cognite/aura/components/textarea';
import { IconMicrophone, IconPlayerStopFilled, IconSend } from '@tabler/icons-react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

import {
  ANSWER_ERROR_TITLE,
  ASSISTANT_NAME,
  DICTATION_FAILURE_MESSAGES,
  SAMPLE_QUESTIONS,
} from '../../constants/agents';
import { ENTER_KEY } from '../../constants/keyboard';
import { RETRY_LABEL } from '../../constants/labels';
import { AppAlertVariant } from '../../enums/appAlertVariant';
import { useAgentComposerViewModel } from '../../hooks/agents/useAgentComposerViewModel';
import { useScrollToEnd } from '../../hooks/general/useScrollToEnd';
import { AppAlert } from '../general/AppAlert';
import { GeneralButton } from '../general/GeneralButton';

import { AgentMessage } from './AgentMessage';
import { AgentPanelHeader } from './AgentPanelHeader';
import { AgentThinking } from './AgentThinking';

type AgentChatProps = {
  onClose: () => void;
};

export function AgentChat({ onClose }: AgentChatProps) {
  const {
    messages,
    isSending,
    errorMessage,
    draft,
    canSend,
    canStartNewChat,
    dictation,
    submit,
    changeDraft,
    toggleDictation,
    sendSample,
    retrySend,
    startNewChat,
  } = useAgentComposerViewModel();
  const logReference = useScrollToEnd<HTMLDivElement>(messages.length, isSending);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submit();
  }
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    changeDraft(event.target.value);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === ENTER_KEY && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <>
      <AgentPanelHeader onClose={onClose}>
        <GeneralButton
          disabled={!canStartNewChat}
          onClick={startNewChat}
          size="sm"
          variant="outline"
        >
          New chat
        </GeneralButton>
      </AgentPanelHeader>
      <div className="agent-panel__body agent-chat">
        <div ref={logReference} role="log" aria-label="Conversation" className="agent-chat__log">
          {messages.length === 0 ? (
            <div className="agent-chat__welcome">
              <p className="agent-panel__empty">Ask {ASSISTANT_NAME} something.</p>
              <ul className="agent-chat__samples" aria-label="Sample questions">
                {SAMPLE_QUESTIONS.map((question) => (
                  <li key={question}>
                    <GeneralButton
                      className="agent-chat__sample"
                      onClick={() => sendSample(question)}
                      variant="outline"
                    >
                      {question}
                    </GeneralButton>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((message) => <AgentMessage key={message.id} message={message} />)
          )}
          {isSending ? <AgentThinking /> : null}
        </div>
        {errorMessage !== null ? (
          <AppAlert
            variant={AppAlertVariant.ERROR}
            title={ANSWER_ERROR_TITLE}
            action={
              <GeneralButton disabled={isSending} onClick={retrySend} variant="secondary">
                {RETRY_LABEL}
              </GeneralButton>
            }
          >
            {errorMessage}
          </AppAlert>
        ) : null}
        {dictation.failure !== null ? (
          <AppAlert variant={AppAlertVariant.ERROR} title="Dictation stopped">
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
              aria-label={dictation.isListening ? 'Stop dictation' : 'Start dictation'}
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
