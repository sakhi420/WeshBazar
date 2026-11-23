import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';
import { refreshAccessToken, request } from './client';
import { ApiError } from './errors';
import { clearLocalLogoutMarker, markLocalLogout } from './session-cookie';

type HeaderMap = Record<string, string>;

function jsonResponse(status: number, body: unknown, headers: HeaderMap = {}): Response {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 503 ? 'Service Unavailable' : status === 401 ? 'Unauthorized' : 'OK',
    headers: {
      get(name: string) {
        return normalizedHeaders[name.toLowerCase()] ?? null;
      },
    },
    json: async () => body,
  } as unknown as Response;
}

const originalFetch = globalThis.fetch;
const originalLocksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  clearAccessToken();
  clearLocalLogoutMarker();
  delete (navigator as Navigator & { locks?: LockManager }).locks;
  fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: originalFetch,
  });
  if (originalLocksDescriptor) {
    Object.defineProperty(navigator, 'locks', originalLocksDescriptor);
  } else {
    delete (navigator as Navigator & { locks?: LockManager }).locks;
  }
});

describe('refreshAccessToken recovery', () => {
  it('returns null for a missing or expired refresh session (401)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, {
        success: false,
        error: { code: 'REFRESH_TOKEN_MISSING', message: 'No refresh session.' },
        requestId: 'refresh-401',
      }),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('preserves the access token and throws the backend error for a temporary 503', async () => {
    setAccessToken('existing-access-token');
    fetchMock.mockResolvedValueOnce(
      jsonResponse(503, {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Temporarily unavailable.' },
        requestId: 'refresh-503',
      }),
    );

    await expect(refreshAccessToken()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
    });
    expect(getAccessToken()).toBe('existing-access-token');
  });

  it('throws NETWORK and preserves the current access token on transport failure', async () => {
    setAccessToken('existing-access-token');
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(refreshAccessToken()).rejects.toMatchObject({
      code: 'NETWORK',
      status: 0,
    });
    expect(getAccessToken()).toBe('existing-access-token');
  });

  it('rejects a successful response that contains no access token', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: { tokens: {} },
        requestId: 'refresh-malformed',
      }),
    );

    await expect(refreshAccessToken()).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 502,
    });
    expect(getAccessToken()).toBeNull();
  });

  it('does not bypass Web Locks when lock acquisition fails', async () => {
    const lockError = new DOMException('Lock request failed', 'NotAllowedError');
    const lockRequest = jest.fn().mockRejectedValue(lockError);
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request: lockRequest } as unknown as LockManager,
    });

    setAccessToken('existing-access-token');
    await expect(refreshAccessToken()).rejects.toMatchObject({
      code: 'NETWORK',
      status: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('existing-access-token');
  });

  it('does not refresh after an explicit local sign-out marker is set', async () => {
    markLocalLogout();
    setAccessToken('stale-access-token');

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });
});

describe('request refresh and replay', () => {
  it('clears the refreshed token when the single replay also returns 401', async () => {
    setAccessToken('expired-access-token');
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Access token expired.' },
          requestId: 'request-expired',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: { tokens: { accessToken: 'fresh-access-token' } },
          requestId: 'refresh-success',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          error: { code: 'SESSION_REVOKED', message: 'Session revoked.' },
          requestId: 'request-replayed',
        }),
      );

    await expect(request('/protected')).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
