function successResponse(accessToken: string): Response {
  return {
    ok: true,
    json: async () => ({
      success: true,
      data: { tokens: { accessToken } },
      requestId: 'request-id',
    }),
  } as Response;
}

async function loadIsolatedClient(): Promise<typeof import('./client')> {
  let client: typeof import('./client') | undefined;
  await jest.isolateModulesAsync(async () => {
    client = await import('./client');
  });
  if (!client) throw new Error('Failed to load isolated API client');
  return client;
}

describe('refreshAccessToken cross-tab coordination', () => {
  const originalFetch = global.fetch;
  const originalLocksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalLocksDescriptor) {
      Object.defineProperty(navigator, 'locks', originalLocksDescriptor);
    } else {
      delete (navigator as Navigator & { locks?: LockManager }).locks;
    }
    jest.clearAllMocks();
  });

  it('serializes refreshes from separate tab contexts through the shared browser lock', async () => {
    let previousLock = Promise.resolve();

    const lockRequest = jest.fn(
      async (
        _name: string,
        _options: { mode: 'exclusive' },
        callback: () => Promise<string | null>,
      ) => {
        const waitFor = previousLock;
        let releaseCurrent: () => void = () => undefined;
        previousLock = new Promise<void>((resolve) => {
          releaseCurrent = resolve;
        });
        await waitFor;
        try {
          return await callback();
        } finally {
          releaseCurrent();
        }
      },
    );

    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request: lockRequest } as unknown as LockManager,
    });

    // Model the browser's shared HttpOnly cookie jar: each completed refresh
    // rotates the cookie before the next same-origin request starts.
    let refreshCookie = 'refresh-0';
    let rotations = 0;
    global.fetch = jest.fn(async () => {
      const presentedCookie = refreshCookie;
      await Promise.resolve();

      // A stale concurrent request would fail and trigger server-side reuse
      // detection. The lock should prevent this branch entirely.
      if (presentedCookie !== refreshCookie) {
        return { ok: false, json: async () => ({}) } as Response;
      }

      rotations += 1;
      refreshCookie = `refresh-${rotations}`;
      return successResponse(`access-${rotations}`);
    }) as unknown as typeof fetch;

    // Two isolated module instances represent two tabs, each with its own
    // module-local refreshInFlight promise.
    const tabA = await loadIsolatedClient();
    const tabB = await loadIsolatedClient();
    const results = await Promise.all([
      tabA.refreshAccessToken(),
      tabB.refreshAccessToken(),
    ]);

    expect(results).toEqual(['access-1', 'access-2']);
    expect(rotations).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(lockRequest).toHaveBeenCalledTimes(2);
    expect(lockRequest).toHaveBeenCalledWith(
      'weshbazar-auth-refresh',
      { mode: 'exclusive' },
      expect.any(Function),
    );
  });

  it('keeps refresh functional when the browser does not expose Web Locks', async () => {
    delete (navigator as Navigator & { locks?: LockManager }).locks;
    global.fetch = jest.fn(async () => successResponse('access-fallback')) as unknown as typeof fetch;

    const client = await loadIsolatedClient();

    await expect(client.refreshAccessToken()).resolves.toBe('access-fallback');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
