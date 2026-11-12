import thinkEyesSprite from './assets/mascot-eyes-think.png';
import idleEyesSprite from './assets/mascot-eyes.png';
import handSprite from './assets/mascot-hand.png';
import waveSprite from './assets/mascot-wave.png';
import restSprite from './assets/mascot.png';
import './mascot.css';
import type { AgentMood } from './enums/agentMood';

export type AgentMascotProperties = {
  /** IDLE shows the smiling eyes; THINKING shows the round eyes that look from side to side. */
  mood: AgentMood;
  /** Raises the arm and waves. Without it the mascot waves only inside a host with `agent-mascot-wave-on-hover`. */
  isWaving?: boolean;
  /** Added to the mascot's root, to place it. It fills the box its parent gives it. */
  className?: string;
};

/** Bottom to top. Both body poses and both pairs of eyes stay loaded, so a swap never flickers. */
const LAYERS = [
  { name: 'agent-mascot__body agent-mascot__body--rest', sprite: restSprite },
  { name: 'agent-mascot__body agent-mascot__body--wave', sprite: waveSprite },
  { name: 'agent-mascot__hand', sprite: handSprite },
  { name: 'agent-mascot__eyes agent-mascot__eyes--idle', sprite: idleEyesSprite },
  { name: 'agent-mascot__eyes agent-mascot__eyes--think', sprite: thinkEyesSprite },
];

/**
 * A helper's face: the ADNOC robot, cut into layers.
 * The body comes at rest and with its arm raised, the raised hand is its own layer, and so are the eyes, so
 * the stylesheet can raise the arm, turn the hand at the wrist, blink the eyes and swap them by mood.
 * It is decoration only: the control around it carries the accessible name.
 */
export function AgentMascot({ mood, isWaving = false, className }: AgentMascotProperties) {
  return (
    <span
      className={className === undefined ? 'agent-mascot' : `agent-mascot ${className}`}
      data-mood={mood}
      data-waving={isWaving}
    >
      {LAYERS.map((layer) => (
        <img
          key={layer.name}
          className={`agent-mascot__layer ${layer.name}`}
          src={layer.sprite}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ))}
    </span>
  );
}
