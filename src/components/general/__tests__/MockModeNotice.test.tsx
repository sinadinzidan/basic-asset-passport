import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MockModeNotice } from '../MockModeNotice';

describe(MockModeNotice.name, () => {
  it('tells the user the data is dummy data', () => {
    render(<MockModeNotice />);

    expect(screen.getByText(/showing dummy data/i)).toBeInTheDocument();
  });
});
