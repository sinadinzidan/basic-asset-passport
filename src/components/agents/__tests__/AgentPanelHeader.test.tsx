import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ASSISTANT_NAME } from '../../../constants/agents';
import { AgentPanelHeader } from '../AgentPanelHeader';

describe(AgentPanelHeader.name, () => {
  it("is headed by the assistant's own name", () => {
    render(<AgentPanelHeader onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: ASSISTANT_NAME })).toBeVisible();
    expect(ASSISTANT_NAME).toBe('Dalil AI');
  });

  it('shows the actions it is given', () => {
    render(
      <AgentPanelHeader onClose={vi.fn()}>
        <button type="button">New chat</button>
      </AgentPanelHeader>,
    );

    expect(screen.getByRole('button', { name: 'New chat' })).toBeVisible();
  });

  it('closes the assistant from its close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AgentPanelHeader onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close assistant' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
