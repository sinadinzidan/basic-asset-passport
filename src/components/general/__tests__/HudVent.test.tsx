import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HudVent } from '../HudVent';

describe(HudVent.name, () => {
  it('draws four bars as decoration, hidden from assistive technology', () => {
    const { container } = render(<HudVent />);

    const vent = container.querySelector('.hud-vent');

    expect(vent).toHaveAttribute('aria-hidden', 'true');
    expect(vent?.children).toHaveLength(4);
  });
});
