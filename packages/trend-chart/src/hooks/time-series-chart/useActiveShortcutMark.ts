import { useEffect } from 'react';

const SHORTCUT_BUTTONS = "[data-slot='shortcuts-panel'] [data-slot='button']";
const ACTIVE_ATTRIBUTE = 'data-active';

/**
 * Marks the date picker's shortcut that stands for the current window with `data-active`, so a stylesheet can
 * highlight it. The picker has no active state for a shortcut and renders its panel in a portal that opens and
 * closes on its own, so the mark is set on the button from outside and set again whenever the page changes. It is
 * an attribute rather than injected CSS, which a content security policy may block.
 */
export function useActiveShortcutMark(activeLabel: string | undefined): void {
  useEffect(() => {
    function mark(): void {
      for (const button of document.querySelectorAll(SHORTCUT_BUTTONS)) {
        if (activeLabel !== undefined && button.textContent?.trim() === activeLabel) {
          button.setAttribute(ACTIVE_ATTRIBUTE, '');
        } else {
          button.removeAttribute(ACTIVE_ATTRIBUTE);
        }
      }
    }

    mark();
    // Only added and removed nodes are watched, so setting the attribute does not trigger another pass.
    const observer = new MutationObserver(mark);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeLabel]);
}
