import { renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  SuccessToastContext,
  useSuccessToast,
  type ShowSuccessToast,
} from '../useSuccessToast';

describe(useSuccessToast.name, () => {
  it('returns the injected function so callers can show a success toast', () => {
    // Arrange
    const showSuccessToast: ShowSuccessToast = vi.fn();
    const wrapper: ComponentType<{ children: ReactNode }> = ({ children }) => (
      <SuccessToastContext.Provider value={showSuccessToast}>
        {children}
      </SuccessToastContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useSuccessToast(), { wrapper });
    result.current('Saved.');

    // Assert
    expect(showSuccessToast).toHaveBeenCalledWith('Saved.');
  });
});
