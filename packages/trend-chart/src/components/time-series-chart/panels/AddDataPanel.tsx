import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { Search } from '@cognite/aura/components/search';
import { IconChartLine } from '@tabler/icons-react';
import { useState } from 'react';

import { SERIES_SEARCH_PAGE_SIZE } from '../../../constants/timeSeriesChart';
import { StateSize } from '../../../enums/stateSize';
import { StateVariant } from '../../../enums/stateVariant';
import { useDebouncedText } from '../../../hooks/platform/useGlobalSearch';
import { useSeriesSearch } from '../../../hooks/time-series-chart/useSeriesSearch';
import { cn } from '../../../lib/utils';
import type { TimeSeriesDefinition } from '../../../types/timeSeriesChart';
import { CHECKBOX_CONTROL_CLASSES } from '../../general/forms/fieldStyles';
import { ErrorState, LoadingRows } from '../../general/QueryState';
import { StateMessage } from '../../general/StateMessage';
import { MetadataText } from '../series/MetadataText';

import { PanelFooter } from './PanelFooter';

interface AddDataPanelProperties {
  existingIds: readonly string[];
  maxSeries: number;
  onAdd: (seriesIds: string[]) => void;
}

interface SeriesChoiceProperties {
  definition: TimeSeriesDefinition;
  isAdded: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

function SeriesChoice({ definition, isAdded, isSelected, onToggle }: SeriesChoiceProperties) {
  const description = definition.description.trim();
  const shouldShowDescription =
    description !== '' && description.toLowerCase() !== definition.name.trim().toLowerCase();
  return (
    <li>
      <CheckboxItem
        className={cn(
          'w-full items-start rounded-md px-2 py-2 hover:bg-muted-background/50',
          isAdded && 'opacity-70',
        )}
      >
        <CheckboxItemControl
          className={CHECKBOX_CONTROL_CLASSES}
          aria-label={`Select ${definition.name}`}
          checked={isSelected}
          disabled={isAdded}
          onCheckedChange={onToggle}
        />
        <CheckboxItemLabel>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className="break-words font-medium text-foreground">{definition.name}</span>
              <span className="tabular-nums shrink-0 text-xs text-muted-foreground">
                {isAdded ? 'Added' : <MetadataText value={definition.unit} />}
              </span>
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
              <span>
                <MetadataText value={definition.tag} />
              </span>
              {shouldShowDescription ? <span>{description}</span> : null}
            </span>
          </span>
        </CheckboxItemLabel>
      </CheckboxItem>
    </li>
  );
}

/**
 * The panel that chooses the series to put on the chart, in the sidebar of the chart workspace: search, tick one or several,
 * confirm. A series already on the chart cannot be chosen and the chart's limit is stated rather than silently applied. The chart
 * shows it only while it is open, so the search and the selection start empty every time.
 */
export function AddDataPanel({ existingIds, maxSeries, onAdd }: AddDataPanelProperties) {
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [limitMessage, setLimitMessage] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(SERIES_SEARCH_PAGE_SIZE);
  const query = useDebouncedText(searchText.trim());
  const search = useSeriesSearch(query, limit);

  const capacity = Math.max(0, maxSeries - existingIds.length);
  const results = search.data?.series ?? [];
  const total = search.data?.total ?? 0;
  const hasMore = results.length < total;

  const handleSearchChange = (text: string): void => {
    setSearchText(text);
    setLimit(SERIES_SEARCH_PAGE_SIZE);
  };

  const handleToggle = (seriesId: string): void => {
    if (selectedIds.includes(seriesId)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== seriesId));
      setLimitMessage(undefined);
      return;
    }
    if (selectedIds.length >= capacity) {
      setLimitMessage(
        capacity === 0
          ? `The chart already shows ${maxSeries} series, the most it can hold. Remove one to add another.`
          : `The chart can hold ${maxSeries} series and ${existingIds.length} ${existingIds.length === 1 ? 'is' : 'are'} already on it. Deselect one to choose another.`,
      );
      return;
    }
    setSelectedIds([...selectedIds, seriesId]);
    setLimitMessage(undefined);
  };

  const handleConfirm = (): void => {
    if (selectedIds.length === 0) return;
    onAdd(selectedIds);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <Search
          value={searchText}
          onChange={(event) => handleSearchChange(event.target.value)}
          onClear={() => handleSearchChange('')}
          placeholder="Search time series"
          aria-label="Search time series"
        />
        <p className="tabular-nums text-xs text-muted-foreground" aria-live="polite">
          {`${selectedIds.length} selected, room for ${Math.max(0, capacity - selectedIds.length)} more`}
        </p>
        {limitMessage ? (
          <Alert variant="error" data-variant="error" role="alert">
            <AlertDescription>{limitMessage}</AlertDescription>
          </Alert>
        ) : null}
        {search.error ? (
          <ErrorState error={search.error} onRetry={() => void search.refetch()} />
        ) : search.data === undefined ? (
          <LoadingRows rows={5} />
        ) : results.length === 0 ? (
          <StateMessage
            variant={StateVariant.NO_RESULTS}
            size={StateSize.INLINE}
            icon={IconChartLine}
            title="No series match"
            description="Try a shorter name or a tag, or clear the search."
          />
        ) : (
          <ul aria-label="Available time series" className="flex flex-col divide-y divide-border">
            {results.map((definition) => (
              <SeriesChoice
                key={definition.id}
                definition={definition}
                isAdded={existingIds.includes(definition.id)}
                isSelected={selectedIds.includes(definition.id)}
                onToggle={() => handleToggle(definition.id)}
              />
            ))}
          </ul>
        )}
        {results.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className="tabular-nums text-xs text-muted-foreground"
              aria-live="polite"
            >{`Showing ${results.length} of ${total}`}</p>
            {hasMore ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={search.isFetching}
                onClick={() => setLimit(limit + SERIES_SEARCH_PAGE_SIZE)}
              >
                Show more
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <PanelFooter>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={selectedIds.length === 0}
          onClick={handleConfirm}
        >
          {`Add ${selectedIds.length} series`}
        </Button>
      </PanelFooter>
    </>
  );
}
