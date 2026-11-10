import thinkEyesSprite from '../../assets/agent/mascot-eyes-think.png';
import idleEyesSprite from '../../assets/agent/mascot-eyes.png';
import handSprite from '../../assets/agent/mascot-hand.png';
import waveSprite from '../../assets/agent/mascot-wave.png';
import restSprite from '../../assets/agent/mascot.png';

export type AgentMood = 'idle' | 'think';

type AgentMascotProps = {
  mood: AgentMood;
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
 * The agent helper's face: the ADNOC robot, cut from its reference pictures by design/mascot/cut_sprites.py.
 * The body comes at rest and with its arm raised, the raised hand is its own layer, and so are the eyes, so
 * the stylesheet can raise the arm, turn the hand at the wrist, blink the eyes and swap them by mood.
 * It is decoration only: the control around it carries the accessible name.
 */
export function AgentMascot({ mood }: AgentMascotProps) {
  return (
    <span className="agent-mascot" data-mood={mood}>
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
