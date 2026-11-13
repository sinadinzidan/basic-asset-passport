import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetTab } from '../../enums/assetTab';
import { parseNavigationState } from '../../lib/navigationState';
import type { NavigationState } from '../../types/navigation';
import { createNavigationStore } from '../navigation';

const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };
const REGISTER: NavigationState = {
  selectedAsset: null,
  activeAssetTab: AssetTab.PROPERTIES,
};

describe(createNavigationStore.name, () => {
  let onChange: (navigationState: NavigationState) => void;

  beforeEach(() => {
    onChange = vi.fn<(navigationState: NavigationState) => void>();
  });

  function makeStore(restored: object = {}) {
    return createNavigationStore({
      initialState: parseNavigationState(JSON.stringify(restored)),
      onChange,
    });
  }

  it('starts on the first page of the register when nothing is restored', () => {
    const store = createNavigationStore();

    expect(store.getState().navigationState).toEqual(REGISTER);
  });

  it('starts from the state it is given, and does not report it as a change', () => {
    const store = makeStore({ selectedAsset, activeAssetTab: AssetTab.EQUIPMENTS });

    expect(store.getState().navigationState).toEqual({
      selectedAsset,
      activeAssetTab: AssetTab.EQUIPMENTS,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps one store apart from another', () => {
    const first = makeStore();
    const second = makeStore();

    first.getState().actions.selectAsset(selectedAsset);

    expect(second.getState().navigationState.selectedAsset).toBeNull();
  });

  it('gives the same actions after every change, so reading them never causes a render', () => {
    const store = makeStore();
    const { actions } = store.getState();

    actions.selectAsset(selectedAsset);

    expect(store.getState().actions).toBe(actions);
  });

  it('works with no one listening for changes', () => {
    const store = createNavigationStore();

    store.getState().actions.selectAsset(selectedAsset);

    expect(store.getState().navigationState.selectedAsset).toEqual(selectedAsset);
  });

  it('selects an asset on the properties tab and reports it', () => {
    const store = makeStore();

    store.getState().actions.selectAsset(selectedAsset);

    const expected = { selectedAsset, activeAssetTab: AssetTab.PROPERTIES };

    expect(store.getState().navigationState).toEqual(expected);
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('changes the tab and keeps the selection', () => {
    const store = makeStore({ selectedAsset });

    store.getState().actions.changeAssetTab(AssetTab.EQUIPMENTS);

    expect(store.getState().navigationState).toEqual({
      selectedAsset,
      activeAssetTab: AssetTab.EQUIPMENTS,
    });
  });

  it('opens a chart and reports its setup', () => {
    const store = makeStore({ selectedAsset });

    store.getState().actions.changeTimeseriesChart({ sig: 'ts:PI.1' });

    expect(store.getState().navigationState.timeseriesChart).toEqual({ sig: 'ts:PI.1' });
    expect(onChange).toHaveBeenCalledWith({
      selectedAsset,
      activeAssetTab: AssetTab.PROPERTIES,
      timeseriesChart: { sig: 'ts:PI.1' },
    });
  });

  it('closes the chart when given no setup', () => {
    const store = makeStore({ selectedAsset, timeseriesChart: { sig: 'ts:PI.1' } });

    store.getState().actions.changeTimeseriesChart(null);

    expect(store.getState().navigationState).not.toHaveProperty('timeseriesChart');
  });

  it('closes the chart when the tab or the asset changes', () => {
    const store = makeStore({ selectedAsset, timeseriesChart: { sig: 'ts:PI.1' } });

    store.getState().actions.changeAssetTab(AssetTab.NOTES);
    expect(store.getState().navigationState).not.toHaveProperty('timeseriesChart');

    store.getState().actions.changeTimeseriesChart({ sig: 'ts:PI.1' });
    store.getState().actions.clearSelectedAsset();
    expect(store.getState().navigationState).not.toHaveProperty('timeseriesChart');
  });

  it('changes the search text and reports it', () => {
    const store = makeStore();

    store.getState().actions.changeSearchQuery('pump');

    expect(store.getState().navigationState.searchQuery).toBe('pump');
    expect(onChange).toHaveBeenCalledWith({ ...REGISTER, searchQuery: 'pump' });
  });

  it('leaves a cleared search out of the state', () => {
    const store = makeStore({ searchQuery: 'pump' });

    store.getState().actions.changeSearchQuery('');

    expect(store.getState().navigationState).not.toHaveProperty('searchQuery');
  });

  it('does not report a search that did not change', () => {
    const store = makeStore({ searchQuery: 'pump' });

    store.getState().actions.changeSearchQuery('pump');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the search when an asset is opened and closed', () => {
    const store = makeStore({ searchQuery: 'pump' });

    store.getState().actions.selectAsset(selectedAsset);
    store.getState().actions.clearSelectedAsset();

    expect(store.getState().navigationState.searchQuery).toBe('pump');
  });

  it('goes to the next page of the register and reports its cursor', () => {
    const store = makeStore();

    store.getState().actions.goToNextRegisterPage('cursor-2');
    store.getState().actions.goToNextRegisterPage('cursor-3');

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2', 'cursor-3']);
    expect(onChange).toHaveBeenLastCalledWith({
      ...REGISTER,
      registerCursors: ['cursor-2', 'cursor-3'],
    });
  });

  it('goes back one page of the register', () => {
    const store = makeStore({ registerCursors: ['cursor-2', 'cursor-3'] });

    store.getState().actions.goToPreviousRegisterPage();

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
  });

  it('leaves the cursors out of the state on the first page', () => {
    const store = makeStore({ registerCursors: ['cursor-2'] });

    store.getState().actions.goToPreviousRegisterPage();

    expect(store.getState().navigationState).not.toHaveProperty('registerCursors');
    expect(onChange).toHaveBeenLastCalledWith(REGISTER);
  });

  it('returns to the first page of the register', () => {
    const store = makeStore({ registerCursors: ['cursor-2', 'cursor-3'] });

    store.getState().actions.goToFirstRegisterPage();

    expect(store.getState().navigationState).not.toHaveProperty('registerCursors');
  });

  it('returns to the first page when the search changes', () => {
    const store = makeStore({ registerCursors: ['cursor-2'] });

    store.getState().actions.changeSearchQuery('pump');

    expect(store.getState().navigationState).not.toHaveProperty('registerCursors');
    expect(store.getState().navigationState.searchQuery).toBe('pump');
  });

  it('keeps the page of the register when an asset is opened and closed', () => {
    const store = makeStore({ registerCursors: ['cursor-2'] });

    store.getState().actions.selectAsset(selectedAsset);
    store.getState().actions.clearSelectedAsset();

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
  });

  it('clears the selection and reports it', () => {
    const store = makeStore({ selectedAsset });

    store.getState().actions.clearSelectedAsset();

    expect(store.getState().navigationState.selectedAsset).toBeNull();
    expect(onChange).toHaveBeenCalledWith(REGISTER);
  });

  it('opens the assistant panel and reports it', () => {
    const store = makeStore();

    store.getState().actions.changeAssistantOpen(true);

    expect(store.getState().navigationState.isAssistantOpen).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ ...REGISTER, isAssistantOpen: true });
  });

  it('leaves the open flag out of the state once the panel closes', () => {
    const store = makeStore({ isAssistantOpen: true });

    store.getState().actions.changeAssistantOpen(false);

    expect(store.getState().navigationState).not.toHaveProperty('isAssistantOpen');
    expect(onChange).toHaveBeenCalledWith(REGISTER);
  });

  it('does not report a panel that is already as asked', () => {
    const store = makeStore();

    store.getState().actions.changeAssistantOpen(false);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the assistant panel open while the reader moves between assets', () => {
    const store = makeStore({ isAssistantOpen: true });

    store.getState().actions.selectAsset(selectedAsset);

    expect(store.getState().navigationState.isAssistantOpen).toBe(true);
  });
});
