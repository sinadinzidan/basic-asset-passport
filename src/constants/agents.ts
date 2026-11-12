import type { DictationFailure } from '../enums/dictationFailure';

export const AGENT_QUERY_STALE_TIME_MS = 60_000;
export const THINKING_WORD_INTERVAL_MS = 2200;

export const THINKING_WORDS = [
  'Warming up the pumps',
  'Reading the gauges',
  'Tracing the pipework',
  'Checking the valves',
  'Dusting off the manuals',
  'Following the cables',
  'Calibrating the sensors',
  'Asking the equipment',
  'Connecting the dots',
  'Consulting the plant records',
  'Bleeding the lines',
  'Tightening a few bolts',
  'Almost there',
] as const;

export const FOCUSED_AGENT_EXTERNAL_ID = 'a0545c2c-27d0-4a1d-a19a-27785cb348f3';

export const SAMPLE_QUESTIONS = [
  'Which assets have high criticality?',
  'Which assets are under maintenance?',
  'What equipment is linked to the first asset?',
  'Which assets have notes?',
] as const;

export const DICTATION_FAILURE_MESSAGES: Record<DictationFailure, string> = {
  BLOCKED: 'Microphone access is blocked. Allow it in the browser to dictate.',
  FAILED: 'Dictation stopped unexpectedly. Try again.',
};

export const ASSISTANT_NAME = 'Dalil AI';
export const ASSISTANT_LABEL = `${ASSISTANT_NAME} assistant`;
export const ASSISTANT_GREETING = `Hi, I'm ${ASSISTANT_NAME}, your assistant`;

export const GREETING_INTRO_DELAY_MS = 1200;
export const GREETING_INTRO_DURATION_MS = 5000;

export const GREETING_HOVER_DELAY_MS = 150;

export const ASSISTANT_LOADING_MESSAGE = 'Loading assistant...';
export const ASSISTANT_ERROR_TITLE = 'The assistant could not be loaded';
export const ASSISTANT_ERROR_DESCRIPTION =
  'Check access to the agents of this project, then try again.';
export const ASSISTANT_MISSING_MESSAGE = 'The assistant is not available in this project.';
export const CHAT_EMPTY_MESSAGE = `Ask ${ASSISTANT_NAME} something.`;
export const THINKING_MESSAGE = 'Thinking...';
export const DICTATION_ERROR_TITLE = 'Dictation stopped';

export const ANSWER_ERROR_TITLE = 'The agent could not answer';
export const SEND_FAILED_FALLBACK_MESSAGE = 'Try again in a moment.';

export const UNEXPECTED_AGENT_MESSAGE = 'CDF returned an agent in an unexpected shape.';
export const UNEXPECTED_REPLY_MESSAGE = 'CDF returned an agent reply in an unexpected shape.';
export const APPROVAL_NOT_SUPPORTED_MESSAGE =
  'This agent needs approval to run a tool, which this chat cannot give.';
export const NO_REPLY_MESSAGE = 'The agent did not reply.';
