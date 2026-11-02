import type { HostAppAPI } from '@cognite/app-sdk';
import { useRef, useState } from 'react';

import type { AssetView } from '../../enums/assetView';
import type { PassportTab } from '../../enums/passportTab';
import type { AppState } from '../../lib/appState';
import { parseInitialState, serializeAppState } from '../../lib/appState';
import * as navigation from '../../lib/navigation';
import type { AssetSelection, FileSelection } from '../../types/asset';

/**
 * Where the user is in the app: the state restored from the Fusion shared link, the moves that change it, and saving each
 * new state back to the link. Moves build on the latest state, so two in quick succession cannot overwrite each other.
 */
export function useAppNavigation(api: Pick<HostAppAPI, 'syncInternalState'> | undefined, initialState: string | undefined) {
  const [state, setState] = useState(() => parseInitialState(initialState));
  const [hasSyncError, setHasSyncError] = useState(false);
  const latest = useRef(state);

  async function move(transition: (current: AppState) => AppState): Promise<void> {
    const next = transition(latest.current);
    latest.current = next;
    setState(next);
    setHasSyncError(false);
    if (!api) return;

    try {
      setHasSyncError(!(await api.syncInternalState(serializeAppState(next))));
    } catch {
      setHasSyncError(true);
    }
  }

  return {
    state,
    hasSyncError,
    goHome: () => void move(navigation.goHome),
    selectAsset: (asset: AssetSelection) => void move((current) => navigation.selectAsset(current, asset)),
    setPassportTab: (tab: PassportTab) => void move((current) => navigation.setPassportTab(current, tab)),
    selectEquipment: (equipmentId: string) => void move((current) => navigation.selectEquipment(current, equipmentId)),
    selectFile: (file: FileSelection | undefined) => void move((current) => navigation.selectFile(current, file)),
    setView: (view: AssetView | undefined) => void move((current) => navigation.setView(current, view)),
    setSearch: (search: string) => void move((current) => navigation.setSearch(current, search)),
    setPageSize: (pageSize: number) => void move((current) => navigation.setPageSize(current, pageSize)),
    setPage: (page: number) => void move((current) => navigation.setPage(current, page)),
  };
}
