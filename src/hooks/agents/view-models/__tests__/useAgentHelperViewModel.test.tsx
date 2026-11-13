import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext } from '../../../../__mocks__/agents';
import { makeAgentWrapper } from '../../../../components/agents/__tests__/AgentTestHarness';
import { PanelPhase } from '../../../../enums/panelPhase';
import type { StateSyncApi } from '../../../../types/host';
import { useAgentHelperViewModel } from '../useAgentHelperViewModel';

describe(useAgentHelperViewModel.name, () => {
  let api: StateSyncApi;

  beforeEach(() => {
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() => Promise.resolve(true)),
    };
  });

  function renderViewModel(hostInitialState?: string) {
    return renderHook(() => useAgentHelperViewModel(), {
      wrapper: makeAgentWrapper({ client: makeAgentContext(), hostApi: api, hostInitialState }),
    });
  }

  it('starts closed, with no agent chosen yet', () => {
    const { result } = renderViewModel();

    expect(result.current.phase).toBe(PanelPhase.CLOSED);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.agent).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it('opens the panel and syncs that it is open', () => {
    const { result } = renderViewModel();

    act(() => result.current.toggle());

    expect(result.current.phase).toBe(PanelPhase.OPEN);
    expect(api.syncInternalState).toHaveBeenCalledWith(
      expect.stringContaining('"isAssistantOpen":true'),
    );
  });

  it('comes back open when the host restores an open panel', () => {
    const { result } = renderViewModel(JSON.stringify({ isAssistantOpen: true }));

    expect(result.current.phase).toBe(PanelPhase.OPEN);
    expect(result.current.isOpen).toBe(true);
  });

  it('keeps the panel on screen while it closes, then lets it go', () => {
    const { result } = renderViewModel(JSON.stringify({ isAssistantOpen: true }));

    act(() => result.current.close());
    expect(result.current.phase).toBe(PanelPhase.CLOSING);
    expect(api.syncInternalState).toHaveBeenCalledWith(
      expect.not.stringContaining('isAssistantOpen'),
    );

    act(() => result.current.finishClosing());
    expect(result.current.phase).toBe(PanelPhase.CLOSED);
  });

  it('closes an open panel when toggled', () => {
    const { result } = renderViewModel(JSON.stringify({ isAssistantOpen: true }));

    act(() => result.current.toggle());

    expect(result.current.phase).toBe(PanelPhase.CLOSING);
  });

  it('opens again at once when toggled while it is still closing', () => {
    const { result } = renderViewModel(JSON.stringify({ isAssistantOpen: true }));

    act(() => result.current.close());

    act(() => result.current.toggle());

    expect(result.current.phase).toBe(PanelPhase.OPEN);
  });

  it('closes on Escape only while the panel is open', () => {
    const { result } = renderViewModel();

    act(() => result.current.closeIfOpen());

    expect(result.current.phase).toBe(PanelPhase.CLOSED);
    expect(api.syncInternalState).not.toHaveBeenCalled();
  });

  it('greets while the mascot is pointed at, and stops when the panel opens', () => {
    const { result } = renderViewModel();

    act(() => result.current.changeGreetingOpen(true));
    expect(result.current.isGreeting).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isGreeting).toBe(false);
  });
});
