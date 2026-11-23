import type { AgentContextType } from './agent';
import type { AssetContextType } from './assetContext';
import type { DocumentFileContextType } from './documentFileContext';
import type { ThreeDContextType } from './threeDContext';
import type { TimeseriesContextType } from './timeseries';

export type MockContexts = {
  assetContext: AssetContextType;
  documentFileContext: DocumentFileContextType;
  timeseriesContext: TimeseriesContextType;
  threeDContext: ThreeDContextType;
  agentContext: AgentContextType;
};
