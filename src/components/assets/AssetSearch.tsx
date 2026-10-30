import { Button } from '@cognite/aura/components/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@cognite/aura/components/input-group';
import { Kbd } from '@cognite/aura/components/kbd';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';

import { ASSET_SEARCH_MAX_LENGTH } from '../../constants/assets';

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export function AssetSearch({ search, onSearchChange }: { search: string; onSearchChange?: (search: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('assetSearch');
    if (typeof value === 'string') onSearchChange?.(value.trim());
  }

  function handleClearClick(): void {
    onSearchChange?.('');
  }

  // "/" jumps to the search field, the way most data apps do, unless the user is already typing somewhere.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form key={search} role="search" aria-label="Asset search" className="flex flex-wrap items-center gap-3" onSubmit={handleSubmit}>
      <InputGroup className="min-w-64 flex-1">
        <InputGroupAddon align="inline-start"><IconSearch aria-hidden /></InputGroupAddon>
        <InputGroupInput ref={inputRef} type="search" name="assetSearch" aria-label="Search assets" aria-keyshortcuts="/" placeholder="Search assets" defaultValue={search}
          maxLength={ASSET_SEARCH_MAX_LENGTH} />
        <InputGroupAddon align="inline-end"><Kbd aria-hidden>/</Kbd></InputGroupAddon>
      </InputGroup>
      <Button type="submit">Search</Button>
      {search && <Button variant="secondary" type="button" onClick={handleClearClick}>Clear search</Button>}
    </form>
  );
}
