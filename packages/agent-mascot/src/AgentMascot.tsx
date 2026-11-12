import thinkEyesSprite from './assets/mascot-eyes-think.png';
import idleEyesSprite from './assets/mascot-eyes.png';
import handSprite from './assets/mascot-hand.png';
import waveSprite from './assets/mascot-wave.png';
import restSprite from './assets/mascot.png';
import './mascot.css';
import type { AgentMood } from './enums/agentMood';

export type AgentMascotProps = {
  mood: AgentMood;
  isWaving?: boolean;
  className?: string;
};
const LAYERS = [
  { name: 'agent-mascot__body agent-mascot__body--rest', sprite: restSprite },
  { name: 'agent-mascot__body agent-mascot__body--wave', sprite: waveSprite },
  { name: 'agent-mascot__hand', sprite: handSprite },
  { name: 'agent-mascot__eyes agent-mascot__eyes--idle', sprite: idleEyesSprite },
  { name: 'agent-mascot__eyes agent-mascot__eyes--think', sprite: thinkEyesSprite },
];
export function AgentMascot({ mood, isWaving = false, className }: AgentMascotProps) {
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
