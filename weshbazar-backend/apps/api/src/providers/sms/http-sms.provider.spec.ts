/**
 * Unit tests for the HTTP SMS provider and the shared message renderer.
 *
 * The gateway is exercised through a mocked global `fetch`, so no network is
 * used; retry behavior is covered both with real timers (bounded by a small
 * base delay) and with fake timers for the transient-then-success path.
 */
import type { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/config.types';
import type { VerificationPurpose } from '../../generated/prisma/enums';
import { HttpSmsProvider } from './http-sms.provider';
import { renderSmsMessage } from './sms-message';

type SmsHttpConfig = AppConfig['providers']['smsHttp'];

const baseConfig: SmsHttpConfig = {
  gatewayUrl: 'https://sms.example.com/send',
  apiKey: 'secret-key',
  apiKeyHeader: 'X-Api-Key',
  apiKeyPrefix: '',
  sender: 'WeshBazar',
  timeoutMs: 10_000,
  maxRetries: 2,
  messageTemplate: 'وزبازار: کد تأیید شما {code} است',
};

function buildProvider(overrides: Partial<SmsHttpConfig> = {}): HttpSmsProvider {
  const smsHttp = { ...baseConfig, ...overrides };
  const configService = {
    get: (key: string) => (key === 'providers.smsHttp' ? smsHttp : undefined),
  } as unknown as ConfigService<AppConfig, true>;
  return new HttpSmsProvider(configService);
}

const input = {
  phone: '+93700000000',
  code: '123456',
  purpose: 'REGISTER' as VerificationPurpose,
};

describe('renderSmsMessage', () => {
  it('replaces {code} and {purpose} placeholders', () => {
    expect(renderSmsMessage('کد: {code} ({purpose})', { code: '123456', purpose: 'REGISTER' })).toBe(
      'کد: 123456 (REGISTER)',
    );
  });

  it('replaces every occurrence and leaves unknown placeholders intact', () => {
    expect(renderSmsMessage('{code}-{code}-{name}', { code: '42', purpose: 'REGISTER' })).toBe(
      '42-42-{name}',
    );
  });
});

describe('HttpSmsProvider', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('POSTs a JSON payload with the configured auth header', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await buildProvider().sendVerificationCode(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://sms.example.com/send');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Api-Key': 'secret-key',
    });
    expect(init.body).toBe(
      JSON.stringify({
        to: '+93700000000',
        message: 'وزبازار: کد تأیید شما 123456 است',
        sender: 'WeshBazar',
      }),
    );
  });

  it('prefixes the API key when configured (e.g. Bearer tokens)', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await buildProvider({ apiKeyHeader: 'Authorization', apiKeyPrefix: 'Bearer ' }).sendVerificationCode(
      input,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer secret-key',
    });
  });

  it('omits the sender field when none is configured', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await buildProvider({ sender: undefined }).sendVerificationCode(input);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).not.toContain('sender');
  });

  it('throws when the gateway responds with a non-2xx status', async () => {
    fetchMock = jest.fn().mockResolvedValue(new Response('nope', { status: 401 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider({ maxRetries: 0 }).sendVerificationCode(input)).rejects.toThrow(
      /responded 401/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure once and then succeeds', async () => {
    fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    jest.useFakeTimers();
    const promise = buildProvider({ maxRetries: 1 }).sendVerificationCode(input);
    await jest.advanceTimersByTimeAsync(200);
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting all retries', async () => {
    fetchMock = jest.fn().mockRejectedValue(new Error('boom'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(buildProvider({ maxRetries: 1 }).sendVerificationCode(input)).rejects.toThrow('boom');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refuses to send when the gateway is not configured', async () => {
    await expect(
      buildProvider({ gatewayUrl: undefined, apiKey: undefined }).sendVerificationCode(input),
    ).rejects.toThrow(/not configured/);
  });
});