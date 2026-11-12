import { DEFAULT_NAVIGATION_STATE } from '../lib/navigationState';
import { createNavigationStore } from '../store/navigation';
import type { NavigationState } from '../types/navigation';

export function makeNavigationStore(overrides: Partial<NavigationState> = {}) {
  return createNavigationStore({ initialState: { ...DEFAULT_NAVIGATION_STATE, ...overrides } });
}
