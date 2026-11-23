import {
  clearLocalLogoutMarker,
  hasLocalLogoutMarker,
  markLocalLogout,
} from './session-cookie';

describe('local logout marker', () => {
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
  let cookieValue = '';

  beforeEach(() => {
    cookieValue = '';
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieValue,
      set: (value: string) => {
        cookieValue = value;
      },
    });
  });

  afterEach(() => {
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    } else {
      delete (document as unknown as { cookie?: string }).cookie;
    }
  });

  it('records an explicit sign-out as a non-secret marker', () => {
    expect(hasLocalLogoutMarker()).toBe(false);

    markLocalLogout();

    expect(hasLocalLogoutMarker()).toBe(true);
    expect(cookieValue).toContain('weshbazar_logged_out=1');
    expect(cookieValue).toContain('path=/');
  });

  it('clears the marker after a successful new sign-in', () => {
    markLocalLogout();
    expect(hasLocalLogoutMarker()).toBe(true);

    clearLocalLogoutMarker();

    expect(hasLocalLogoutMarker()).toBe(false);
    expect(cookieValue).toContain('weshbazar_logged_out=');
    expect(cookieValue).toContain('max-age=0');
  });
});
