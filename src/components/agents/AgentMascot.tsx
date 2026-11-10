import thinkEyesSprite from '../../assets/agent/mascot-eyes-think.png';
import idleEyesSprite from '../../assets/agent/mascot-eyes.png';
import bodySprite from '../../assets/agent/mascot.png';

export type AgentMood = 'idle' | 'think';

type AgentMascotProps = {
  mood: AgentMood;
};

/**
 * The agent helper's face: the ADNOC robot, cut from its reference picture by design/mascot/cut_sprites.py.
 * The eyes are their own layers over the body so the stylesheet can blink them and swap them by mood.
 * It is decoration only: the control around it carries the accessible name.
 */
export function AgentMascot({ mood }: AgentMascotProps) {
  return (
    <span className="agent-mascot" data-mood={mood}>
      <img
        className="agent-mascot__layer agent-mascot__body"
        src={bodySprite}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="agent-mascot__layer agent-mascot__eyes agent-mascot__eyes--idle"
        src={idleEyesSprite}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="agent-mascot__layer agent-mascot__eyes agent-mascot__eyes--think"
        src={thinkEyesSprite}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </span>
  );
}
