import {
  ASSETS_EMPTY_DESCRIPTION,
  ASSETS_EMPTY_TITLE,
  ASSETS_NO_MATCH_TITLE,
} from '../../constants/assets';
import { formatNoMatchingAssetsMessage } from '../../lib/assetMessage';
import { EmptyStateMessage } from '../general';

type AssetTableEmptyStateProps = {
  searchQuery: string;
};

export function AssetTableEmptyState({ searchQuery }: AssetTableEmptyStateProps) {
  if (searchQuery !== '') {
    return (
      <EmptyStateMessage
        title={ASSETS_NO_MATCH_TITLE}
        description={formatNoMatchingAssetsMessage(searchQuery)}
      />
    );
  }

  return <EmptyStateMessage title={ASSETS_EMPTY_TITLE} description={ASSETS_EMPTY_DESCRIPTION} />;
}
