import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UseRotatingWordContext } from '../../../hooks/agents/useRotatingWord';
import { AgentThinking } from '../AgentThinking';

describe(AgentThinking.name, () => {
  function renderThinking() {
    let tick: () => void = () => {};
    render(
      <UseRotatingWordContext.Provider
        value={{
          startTicker: (onTick) => {
            tick = onTick;
            return () => {};
          },
          pickStartIndex: () => 0,
        }}
      >
        <AgentThinking />
      </UseRotatingWordContext.Provider>,
    );
    return { tick: () => act(() => tick()) };
  }

  it('says the agent is thinking to assistive technology, once', () => {
    renderThinking();

    expect(screen.getByRole('status')).toHaveTextContent('Thinking...');
  });

  it('shows a playful word on screen and changes it over time', () => {
    const { tick } = renderThinking();
    const visible = () =>
      screen
        .getByRole('status')
        .querySelector('[aria-hidden="true"].agent-chat__word')?.textContent;

    const first = visible();
    tick();

    expect(first).toMatch(/\.\.\.$/);
    expect(visible()).not.toBe(first);
    expect(visible()).toMatch(/\.\.\.$/);
  });
});
