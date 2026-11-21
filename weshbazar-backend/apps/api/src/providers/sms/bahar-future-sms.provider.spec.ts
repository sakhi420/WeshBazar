import type { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { VerificationPurpose } from '../../generated/prisma/enums';
import { BaharFutureSmsProvider } from './bahar-future-sms.provider';

type BaharFutureConfig = AppConfig['providers']['smsBaharFuture'];

const baseConfig: BaharFutureConfig = {
  username: 'account-user',
  password: 'account-password',
  sender: 'WeshBazar',
  timeoutMs: 10_000,
  maxRetries: 2,
  messageTemplate: 'وزبازار: کد تأیید شما {code} است',
};

function buildProvider(overrides: Partial<BaharFutureConfig> = {}): BaharFutureSmsProvider {
  const smsBaharFuture = { ...baseConfig, ...overrides };
  const configService = {
    get: (key: string) => (key === 'providers.smsBaharFuture' ? smsBaharFuture : undefined),
  } as unknown as ConfigService<AppConfig, true>;
  return new BaharFutureSmsProvider(configService);
}

const input = {
  phone: '+93700000000',
  code: '493202',
  purpose: 'REGISTER' as VerificationPurpose,
};

describe('BaharFutureSmsProvider', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('posts credentials, Afghan destination and Dari content as HTTPS form data', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('"provider-message-id"', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await buildProvider().sendVerificationCode(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://sms.baharfuture.com/send');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    });
    const form = new URLSearchParams(String(init.body));
    expect([...form.entries()]).toEqual([
      ['username', 'account-user'],
      ['password', 'account-password'],
      ['to', '93700000000'],
      ['content', 'وزبازار: کد تأیید شما 493202 است'],
      ['from', 'WeshBazar'],
    ]);
    expect(url).not.toContain('password');
  });

  it('omits the sender ID when it is not configured', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('message-123', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await buildProvider({ sender: undefined }).sendVerificationCode(input);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).not.toContain('from=');
  });

  it('accepts the vendor JSON-quoted message ID response', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('"8f3a2c66-7cd4-4b47-a3e5-2ac5d2e5f9d0"', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).resolves.toBeUndefined();
  });

  it('does not retry HTTP 400 validation failures', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('Error "Argument [to]"', { status: 400 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).rejects.toThrow(/arguments or destination/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('explains HTTP 403 without leaking credentials', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('Error "Authentication failure"', { status: 403 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).rejects.toThrow(/credentials or the prepaid account balance/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('explains a missing operator route and does not retry', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('Error "No route found"', { status: 412 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).rejects.toThrow(/no active SMS route/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries only the vendor-documented HTTP 500 response', async () => {
    fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response('Error "Cannot send submit_sm"', { status: 500 }))
      .mockResolvedValueOnce(new Response('"message-accepted"', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    jest.useFakeTimers();
    const pending = buildProvider({ maxRetries: 1 }).sendVerificationCode(input);
    await jest.advanceTimersByTimeAsync(250);
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry an ambiguous network failure', async () => {
    fetchMock = jest.fn().mockRejectedValue(new Error('network timeout'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).rejects.toThrow('network timeout');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects non-Afghan phone formats before contacting the gateway', async () => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      buildProvider().sendVerificationCode({ ...input, phone: '+12025550123' }),
    ).rejects.toThrow(/93XXXXXXXXX/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when credentials are missing', async () => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      buildProvider({ username: undefined, password: undefined }).sendVerificationCode(input),
    ).rejects.toThrow(/BAHAR_FUTURE_USERNAME and BAHAR_FUTURE_PASSWORD/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an error-like HTTP 200 response body', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('Error "Cannot charge"', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider().sendVerificationCode(input)).rejects.toThrow(/without a valid SMS message ID/);
  });
});
