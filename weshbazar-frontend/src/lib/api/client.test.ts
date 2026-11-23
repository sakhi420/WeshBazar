import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';
import { refreshAccessToken, request } from './client';
import { ApiError } from './errors';

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
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  clearAccessToken();
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
});

describe('refreshAccessToken', () => {
  it('returns null for an expired or missing refresh session (401)', async () => {
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

  it('preserves the session state and throws a typed error for a temporary 503', async () => {
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

  it('throws NETWORK instead of treating a transport failure as logout', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(refreshAccessToken()).rejects.toMatchObject({
      code: 'NETWORK',
      status: 0,
    });
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
