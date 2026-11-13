import { useState } from 'react';

import { PanelPhase } from '../../../enums/panelPhase';
import { useNavigationState } from '../../general/useNavigationState';
import { useAgentGreeting } from '../useAgentGreeting';

import { useAgentChatViewModel } from './useAgentChatViewModel';

export function useAgentHelperViewModel() {
  const { agent, isSending } = useAgentChatViewModel();
  const { isIntroShown, dismissIntro } = useAgentGreeting();
  const isOpen = useNavigationState((store) => store.navigationState.isAssistantOpen === true);
  const changeAssistantOpen = useNavigationState((store) => store.actions.changeAssistantOpen);

  const [isPointedAt, setIsPointedAt] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const phase = isOpen ? PanelPhase.OPEN : isClosing ? PanelPhase.CLOSING : PanelPhase.CLOSED;

  const isGreeting = phase === PanelPhase.CLOSED && (isIntroShown || isPointedAt);

  function stopGreeting(): void {
    setIsPointedAt(false);
    dismissIntro();
  }
  function close(): void {
    stopGreeting();
    setIsClosing(true);
    changeAssistantOpen(false);
  }
  function toggle(): void {
    if (isOpen) {
      close();

      return;
    }

    stopGreeting();
    setIsClosing(false);
    changeAssistantOpen(true);
  }
  function closeIfOpen(): void {
    if (isOpen) close();
  }

  function finishClosing(): void {
    setIsClosing(false);
  }
  function changeGreetingOpen(isGreetingOpen: boolean): void {
    setIsPointedAt(isGreetingOpen);

    if (!isGreetingOpen) dismissIntro();
  }

  function keepIntroGreeting(): void {
    if (isIntroShown) setIsPointedAt(true);
  }

  return {
    agent,
    isSending,
    phase,
    isOpen,
    isGreeting,
    toggle,
    close,
    closeIfOpen,
    finishClosing,
    changeGreetingOpen,
    keepIntroGreeting,
  };
}
