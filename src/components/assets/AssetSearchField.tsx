import { Search } from '@cognite/aura/components/search';
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { ASSET_SEARCH_DEBOUNCE_MS } from '../../constants/assets';
import { useDebouncedCallback } from '../../hooks/general/useDebouncedCallback';

type AssetSearchFieldProps = {
  /** The search that is applied now. */
  value: string;
  /** Applies a search; an empty text means no search. */
  onChange: (searchText: string) => void;
};

/**
 * The search box of the asset register. What is typed shows at once, but is
 * applied only after a pause, on Enter, or when cleared, so the register is not
 * searched on every keystroke.
 */
export function AssetSearchField({ value, onChange }: AssetSearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const apply = useDebouncedCallback(onChange, ASSET_SEARCH_DEBOUNCE_MS);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraft(event.target.value);
    apply.run(event.target.value.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') return;
    apply.cancel();
    onChange(draft.trim());
  }

  function handleClear(): void {
    setDraft('');
    apply.cancel();
    onChange('');
  }

  return (
    <Search
      aria-label="Search assets"
      onChange={handleChange}
      onClear={handleClear}
      onKeyDown={handleKeyDown}
      placeholder="Search name, description or plant"
      value={draft}
    />
  );
}
