import { Window } from 'happy-dom';
import '@testing-library/jest-dom/vitest';

// Happy DOM rejects canceled Web Animations during cleanup; use the animation library's JS fallback.
Object.defineProperty(Element.prototype, 'animate', { value: undefined, configurable: true });

// Newer Node versions define their own `localStorage` global that is undefined unless started with
// --localstorage-file, and it hides Happy DOM's. Provide Happy DOM's storage so tests behave like a browser.
if (typeof globalThis.localStorage === 'undefined') {
  const { localStorage, sessionStorage } = new Window();
  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorage, configurable: true });
}
