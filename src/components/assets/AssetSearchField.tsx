import { Search } from '@cognite/aura/components/search';
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { ASSET_SEARCH_DEBOUNCE_MS } from '../../constants/assets';
import { ENTER_KEY } from '../../constants/keyboard';
import { useDebouncedCallback } from '../../hooks/general/useDebouncedCallback';

type AssetSearchFieldProps = {
  value: string;

  onChange: (searchText: string) => void;
};

export function AssetSearchField({ value, onChange }: AssetSearchFieldProps) {
  const apply = useDebouncedCallback(onChange, ASSET_SEARCH_DEBOUNCE_MS);

  const [draft, setDraft] = useState(value);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setDraft(event.target.value);
    apply.run(event.target.value.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== ENTER_KEY) return;
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
