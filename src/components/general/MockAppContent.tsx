import { AgentClientContext } from '../../hooks/agents/useAgentClient';
import { DocumentFileClientContext } from '../../hooks/assets/documents/useDocumentFileClient';
import { TimeseriesClientContext } from '../../hooks/assets/timeseries/useTimeseriesClient';
import { AssetClientContext } from '../../hooks/assets/useAssetClient';
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
      <AssetClientContext.Provider value={mockContexts.assetContext}>
        <DocumentFileClientContext.Provider value={mockContexts.documentFileContext}>
          <TimeseriesClientContext.Provider value={mockContexts.timeseriesContext}>
            <Assets />
          </TimeseriesClientContext.Provider>
        </DocumentFileClientContext.Provider>
      </AssetClientContext.Provider>
      <AgentClientContext.Provider value={mockContexts.agentContext}>
        <AgentHelper />
      </AgentClientContext.Provider>
    </NavigationProvider>
  );
}
