import { AgentClientContext } from '../../hooks/agents/useAgentClient';
import { DocumentFileContext } from '../../hooks/assets/documents/useDocumentFileContext';
import { TimeseriesContext } from '../../hooks/assets/timeseries/useTimeseriesContext';
import { AssetContext } from '../../hooks/assets/useAssetContext';
import { Assets } from '../../pages/assets/Assets';
import { NavigationProvider } from '../../providers/general/NavigationProvider';
import type { MockContexts } from '../../types/mockContext';
import { AgentHelper } from '../agents';

import { MockModeNotice } from './MockModeNotice';

type MockAppContentProps = {
  mockContexts: MockContexts;
};

export function MockAppContent({ mockContexts }: MockAppContentProps) {
  return (
    <NavigationProvider api={null}>
      <MockModeNotice />
      <AssetContext.Provider value={mockContexts.assetContext}>
        <DocumentFileContext.Provider value={mockContexts.documentFileContext}>
          <TimeseriesContext.Provider value={mockContexts.timeseriesContext}>
            <Assets />
          </TimeseriesContext.Provider>
        </DocumentFileContext.Provider>
      </AssetContext.Provider>
      <AgentClientContext.Provider value={mockContexts.agentContext}>
        <AgentHelper />
      </AgentClientContext.Provider>
    </NavigationProvider>
  );
}
