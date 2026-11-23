import { ApiError, clearAccessToken, post, refreshAccessToken } from '@/lib/api';
import { logout } from './api';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    clearAccessToken: jest.fn(),
    post: jest.fn(),
    refreshAccessToken: jest.fn(),
  };
});

const mockedPost = jest.mocked(post);
const mockedRefresh = jest.mocked(refreshAccessToken);
const mockedClearAccessToken = jest.mocked(clearAccessToken);

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses one explicit refresh when the access token already expired', async () => {
    mockedPost
      .mockRejectedValueOnce(
        new ApiError({
          code: 'TOKEN_EXPIRED',
          message: 'Expired.',
          status: 401,
        }),
      )
      .mockResolvedValueOnce(undefined);
    mockedRefresh.mockResolvedValueOnce('fresh-access-token');

    await logout();

    expect(mockedPost).toHaveBeenNthCalledWith(1, '/auth/logout', undefined, {
      skipAuthRefresh: true,
    });
    expect(mockedRefresh).toHaveBeenCalledWith({ allowLocalLogout: true });
    expect(mockedPost).toHaveBeenNthCalledWith(2, '/auth/logout', undefined, {
      skipAuthRefresh: true,
    });
    expect(mockedClearAccessToken).toHaveBeenCalledTimes(1);
  });

  it('does not try to refresh after a network failure and still clears the local token', async () => {
    mockedPost.mockRejectedValueOnce(new TypeError('network offline'));

    await expect(logout()).rejects.toThrow('network offline');

    expect(mockedRefresh).not.toHaveBeenCalled();
    expect(mockedClearAccessToken).toHaveBeenCalledTimes(1);
  });
});
