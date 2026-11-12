import { THINKING_WORD_INTERVAL_MS, THINKING_WORDS } from '../../constants/agents';
import { useRotatingWord } from '../../hooks/general/useRotatingWord';

export function AgentThinking() {
  const word = useRotatingWord(THINKING_WORDS, THINKING_WORD_INTERVAL_MS);

  return (
    <p role="status" className="agent-chat__message agent-chat__thinking" data-role="AGENT">
      <span aria-hidden className="agent-chat__orbit" />
      <span className="sr-only">Thinking...</span>
      <span aria-hidden className="agent-chat__word agent-chat__shimmer" key={word}>
        {word}...
      </span>
    </p>
  );
}
