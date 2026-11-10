import type { DictationFailure } from '../types/speech';

export const AGENT_QUERY_STALE_TIME_MS = 60_000;
export const THINKING_WORD_INTERVAL_MS = 2200;
// Plant-floor flavoured, in the spirit of the Claude Code spinner. Each reads as "<word>...".
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

// The one agent the helper chats with. It must exist in the CDF project.
export const FOCUSED_AGENT_EXTERNAL_ID = 'a0545c2c-27d0-4a1d-a19a-27785cb348f3';

// Shown in an empty chat. They are generic: they name no asset, so they work in any project.
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

/** How long a copy button keeps saying "Copied" before it offers to copy again. */
export const COPY_CONFIRMATION_MS = 1800;

/** The assistant's own name. The helper shows it instead of the name the agent has in CDF. */
export const ASSISTANT_NAME = 'Dalil';
export const ASSISTANT_LABEL = `${ASSISTANT_NAME}, AI assistant`;
export const ASSISTANT_GREETING = `Hi, I'm ${ASSISTANT_NAME}, your assistant`;

/** The mascot greets by itself once: this long after the app opens, and for this long. */
export const GREETING_INTRO_DELAY_MS = 1200;
export const GREETING_INTRO_DURATION_MS = 5000;
/** How long the pointer rests on the mascot before it greets, so a pointer passing by does not set it off. */
export const GREETING_HOVER_DELAY_MS = 150;
