import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ASSISTANT_LABEL } from '../../../constants/agents';
import { makeMockAgentContext } from '../../../mocks/mockAgentContext';
import { makeMockAssetContext, makeMockDocumentFileContext } from '../../../mocks/mockAssetContext';
import { makeMockTimeseriesContext } from '../../../mocks/mockTimeseriesContext';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import type { MockContexts } from '../../../types/mockContext';
import { MockAppContent } from '../MockAppContent';

describe(MockAppContent.name, () => {
  function renderContent() {
    return render(<MockAppContent mockContexts={makeMockContexts()} />, {
      wrapper: makeQueryClientWrapper(),
    });
  }

  it('says that the data is dummy data', () => {
    renderContent();

    expect(screen.getByText(/showing dummy data/i)).toBeInTheDocument();
  });

  it('shows the asset register from the dummy data, with its counts', async () => {
    renderContent();

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Assets' })).toHaveTextContent('25'),
    );
  });

  it('keeps the assistant, whose panel says it is not available', async () => {
    const user = userEvent.setup();
    renderContent();

    await user.click(screen.getByRole('button', { name: ASSISTANT_LABEL }));

    expect(await screen.findByText(/assistant is not available/i)).toBeInTheDocument();
  });
});

function makeMockContexts(): MockContexts {
  const assetContext = makeMockAssetContext(0);

  return {
    assetContext,
    documentFileContext: makeMockDocumentFileContext(assetContext),
    timeseriesContext: makeMockTimeseriesContext(),
    agentContext: makeMockAgentContext(),
  };
}
