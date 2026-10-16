/**
 * @jest-environment node
 *
 * Guards the SSR fetch timeout so an unreachable backend cannot hang the
 * server render (the "stuck skeleton" regression). The shared server verbs
 * must always settle — either with data or a typed NETWORK error. Runs under
 * the Node environment because `server.ts` relies on `crypto.randomUUID()`.
 */

import { ApiErrorCode } from './errors';
import { serverGet } from './server';

describe('serverGet (SSR)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('times out with a NETWORK error when the backend never responds', async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    ) as unknown as typeof fetch;

    const pending = serverGet<string[]>('/categories', { timeoutMs: 500 });
    const assertion = expect(pending).rejects.toMatchObject({
      code: ApiErrorCode.NETWORK,
      status: 0,
    });

    jest.advanceTimersByTime(501);
    await assertion;
  });

  it('maps a transport rejection to a NETWORK error instead of hanging', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new TypeError('fetch failed')),
    ) as unknown as typeof fetch;

    await expect(serverGet<string[]>('/categories', { timeoutMs: 0 })).rejects.toMatchObject({
      code: ApiErrorCode.NETWORK,
      status: 0,
    });
  });
});