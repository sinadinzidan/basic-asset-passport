import { THREE_D_MODEL_NAME, THREE_D_VIEW_KICKER } from '../../../constants/threeD';
import { PageHeader, PageShell } from '../../general';

import { LazyAssetThreeD } from './LazyAssetThreeD';

export function ThreeDView() {
  return (
    <PageShell>
      <PageHeader kicker={THREE_D_VIEW_KICKER} title={THREE_D_MODEL_NAME} />
      <LazyAssetThreeD />
    </PageShell>
  );
}
