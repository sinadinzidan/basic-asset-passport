import { Window } from 'happy-dom';
import '@testing-library/jest-dom/vitest';

// Happy DOM rejects canceled Web Animations during cleanup; use the animation library's JS fallback.
Object.defineProperty(Element.prototype, 'animate', { value: undefined, configurable: true });

// Newer Node versions define their own `localStorage` global. Unless Node is started with --localstorage-file it is
// either undefined or an object without working methods, and it hides Happy DOM's. Provide Happy DOM's storage
// whenever the global one cannot be used, so tests behave like a browser on every Node version.
if (!hasWorkingStorage()) {
  const { localStorage, sessionStorage } = new Window();

  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  });
}

function hasWorkingStorage(): boolean {
  try {
    return typeof globalThis.localStorage?.clear === 'function';
  } catch {
    return false;
  }
}
