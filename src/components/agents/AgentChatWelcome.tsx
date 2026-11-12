import { CHAT_EMPTY_MESSAGE, SAMPLE_QUESTIONS } from '../../constants/agents';
import { GeneralButton } from '../general';

type AgentChatWelcomeProps = {
  onSelect: (question: string) => void;
};

export function AgentChatWelcome({ onSelect }: AgentChatWelcomeProps) {
  return (
    <div className="agent-chat__welcome">
      <p className="agent-panel__empty">{CHAT_EMPTY_MESSAGE}</p>
      <ul className="agent-chat__samples" aria-label="Sample questions">
        {SAMPLE_QUESTIONS.map((question) => (
          <li key={question}>
            <GeneralButton
              className="agent-chat__sample"
              onClick={() => onSelect(question)}
              variant="outline"
            >
              {question}
            </GeneralButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
