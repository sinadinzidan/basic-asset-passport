import { PanelPhase } from '../../enums/panelPhase';
import { useNavigationState } from '../general/useNavigationState';

import { useAgentChatState } from './useAgentChatState';
import { useAgentChatViewModel } from './useAgentChatViewModel';
import { useAgentGreeting } from './useAgentGreeting';

export function useAgentHelperViewModel() {
  const { agent, isSending } = useAgentChatViewModel();
  const { isIntroShown, dismissIntro } = useAgentGreeting();
  const isOpen = useNavigationState((store) => store.navigationState.isAssistantOpen === true);
  const changeAssistantOpen = useNavigationState((store) => store.actions.changeAssistantOpen);
  const isPointedAt = useAgentChatState((store) => store.isMascotPointedAt);
  const isClosing = useAgentChatState((store) => store.isPanelClosing);
  const setIsPointedAt = useAgentChatState((store) => store.changeMascotPointedAt);
  const setIsClosing = useAgentChatState((store) => store.changePanelClosing);

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
