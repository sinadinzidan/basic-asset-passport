import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CHAT_EMPTY_MESSAGE, SAMPLE_QUESTIONS } from '../../../constants/agents';
import { AgentChatWelcome } from '../AgentChatWelcome';

describe(AgentChatWelcome.name, () => {
  it('invites a question and lists every sample question', () => {
    render(<AgentChatWelcome onSelect={vi.fn()} />);

    expect(screen.getByText(CHAT_EMPTY_MESSAGE)).toBeInTheDocument();
    const samples = screen.getByRole('list', { name: 'Sample questions' });

    expect(within(samples).getAllByRole('button')).toHaveLength(SAMPLE_QUESTIONS.length);
  });

  it('hands the sample question that is chosen to its caller', async () => {
    const onSelect = vi.fn();
    const [question] = SAMPLE_QUESTIONS;

    render(<AgentChatWelcome onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: question }));

    expect(onSelect).toHaveBeenCalledWith(question);
  });
});
