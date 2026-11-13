import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadIsMockMode(): Promise<boolean> {
  vi.resetModules();
  const { isMockMode } = await import('../env');

  return isMockMode;
}

describe('isMockMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is off when VITE_MOCK_MODE is not set', async () => {
    vi.stubEnv('VITE_MOCK_MODE', '');

    expect(await loadIsMockMode()).toBe(false);
  });

  it('is on when VITE_MOCK_MODE is "true"', async () => {
    vi.stubEnv('VITE_MOCK_MODE', 'true');

    expect(await loadIsMockMode()).toBe(true);
  });

  it.each(['false', 'TRUE', '1', 'yes'])(
    'stays off for %j so only an explicit "true" enables it',
    async (value) => {
      vi.stubEnv('VITE_MOCK_MODE', value);

      expect(await loadIsMockMode()).toBe(false);
    },
  );
});
