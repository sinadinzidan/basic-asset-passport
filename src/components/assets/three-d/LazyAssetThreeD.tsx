import { lazy, Suspense } from 'react';

import { THREE_D_LOADING_MESSAGE } from '../../../constants/threeD';
import { LoadingNotice } from '../../general';

const AssetThreeD = lazy(() =>
  import('./AssetThreeD').then((module) => ({ default: module.AssetThreeD })),
);

export function LazyAssetThreeD() {
  return (
    <Suspense fallback={<LoadingNotice message={THREE_D_LOADING_MESSAGE} />}>
      <AssetThreeD />
    </Suspense>
  );
}
