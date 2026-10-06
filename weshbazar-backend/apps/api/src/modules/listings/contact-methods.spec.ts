/**
 * Unit tests for the contact-method engine (spec §53).
 *
 * The engine is the single authority on what a seller may configure — value
 * formats (E.164 overrides, Telegram handles), the default set — and on the
 * resolution rules used by the contact endpoint: only enabled rows reveal,
 * phone-derived methods fall back to the seller's phone, Telegram never does.
 */
import {
  DEFAULT_CONTACT_METHODS,
  normalizeContactMethods,
  orderContactMethods,
  resolveContactValue,
  type ContactMethodValue,
} from './contact-methods';

describe('normalizeContactMethods', () => {
  it('enables phone-derived methods without an override by default', () => {
    const { methods, issues } = normalizeContactMethods([{ type: 'PHONE' }, { type: 'WHATSAPP' }]);
    expect(issues).toEqual([]);
    expect(methods).toEqual([
      { type: 'PHONE', enabled: true, valueOverride: null },
      { type: 'WHATSAPP', enabled: true, valueOverride: null },
    ]);
  });

  it('accepts an explicit disable without a value', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'PHONE', enabled: false },
      { type: 'WHATSAPP', enabled: true },
    ]);
    expect(issues).toEqual([]);
    expect(methods).toEqual([
      { type: 'PHONE', enabled: false, valueOverride: null },
      { type: 'WHATSAPP', enabled: true, valueOverride: null },
    ]);
  });

  it('normalizes phone and WhatsApp overrides to E.164', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'PHONE', valueOverride: '0701234567' },
      { type: 'WHATSAPP', valueOverride: '+93 701 234 567' },
    ]);
    expect(issues).toEqual([]);
    expect(methods.map((method) => method.valueOverride)).toEqual(['+93701234567', '+93701234567']);
  });

  it('turns blank override strings into null (seller-phone fallback)', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'WHATSAPP', valueOverride: '   ' },
    ]);
    expect(issues).toEqual([]);
    expect(methods).toEqual([{ type: 'WHATSAPP', enabled: true, valueOverride: null }]);
  });

  it('rejects an invalid phone override with a field-level issue', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'PHONE', valueOverride: 'not-a-number' },
    ]);
    expect(methods).toEqual([]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.field).toBe('contactMethods.PHONE');
  });

  it('requires a handle to enable Telegram', () => {
    const { methods, issues } = normalizeContactMethods([{ type: 'TELEGRAM' }]);
    expect(methods).toEqual([]);
    expect(issues).toEqual([
      {
        field: 'contactMethods.TELEGRAM',
        messages: ['A Telegram handle is required to enable this method.'],
      },
    ]);
  });

  it('allows a disabled Telegram entry without a handle', () => {
    const { methods, issues } = normalizeContactMethods([{ type: 'TELEGRAM', enabled: false }]);
    expect(issues).toEqual([]);
    expect(methods).toEqual([{ type: 'TELEGRAM', enabled: false, valueOverride: null }]);
  });

  it('canonicalizes Telegram handles and accepts a bare username', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'TELEGRAM', valueOverride: 'wesh_bazar' },
    ]);
    expect(issues).toEqual([]);
    expect(methods).toEqual([{ type: 'TELEGRAM', enabled: true, valueOverride: '@wesh_bazar' }]);
  });

  it('rejects malformed Telegram handles', () => {
    const bad = ['@ab', '@1nvalid', 'has space', '@this_handle_is_far_too_long_to_be_valid'];
    for (const valueOverride of bad) {
      const { methods, issues } = normalizeContactMethods([{ type: 'TELEGRAM', valueOverride }]);
      expect(methods).toEqual([]);
      expect(issues).toHaveLength(1);
      expect(issues[0]?.field).toBe('contactMethods.TELEGRAM');
    }
  });

  it('rejects duplicate types — the storage key is (listingId, type)', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'PHONE' },
      { type: 'PHONE', valueOverride: '0700000000' },
    ]);
    expect(methods).toEqual([{ type: 'PHONE', enabled: true, valueOverride: null }]);
    expect(issues).toEqual([
      {
        field: 'contactMethods.PHONE',
        messages: ['Each contact method type may appear at most once.'],
      },
    ]);
  });

  it('orders results PHONE, WHATSAPP, TELEGRAM regardless of input order', () => {
    const { methods } = normalizeContactMethods([
      { type: 'TELEGRAM', valueOverride: '@weshbazar' },
      { type: 'WHATSAPP' },
      { type: 'PHONE' },
    ]);
    expect(methods.map((method) => method.type)).toEqual(['PHONE', 'WHATSAPP', 'TELEGRAM']);
  });

  it('reports every issue at once', () => {
    const { methods, issues } = normalizeContactMethods([
      { type: 'TELEGRAM' },
      { type: 'PHONE', valueOverride: 'nope' },
    ]);
    expect(methods).toEqual([]);
    expect(issues).toHaveLength(2);
  });
});

describe('orderContactMethods', () => {
  it('keeps unrelated row properties (storage rows pass through)', () => {
    const rows = [
      { type: 'TELEGRAM' as const, enabled: true, valueOverride: '@x_y_z', id: 'row-3' },
      { type: 'PHONE' as const, enabled: true, valueOverride: null, id: 'row-1' },
    ];
    expect(orderContactMethods(rows).map((row) => row.id)).toEqual(['row-1', 'row-3']);
  });
});

describe('resolveContactValue', () => {
  const sellerPhone = '+93700111222';

  it('falls back to the seller phone for PHONE and WHATSAPP', () => {
    expect(
      resolveContactValue(
        'PHONE',
        [{ type: 'PHONE', enabled: true, valueOverride: null }],
        sellerPhone,
      ),
    ).toBe(sellerPhone);
    expect(
      resolveContactValue(
        'WHATSAPP',
        [{ type: 'WHATSAPP', enabled: true, valueOverride: null }],
        sellerPhone,
      ),
    ).toBe(sellerPhone);
  });

  it('prefers the per-listing override', () => {
    expect(
      resolveContactValue(
        'WHATSAPP',
        [{ type: 'WHATSAPP', enabled: true, valueOverride: '+93700999888' }],
        sellerPhone,
      ),
    ).toBe('+93700999888');
  });

  it('never reveals a disabled method', () => {
    expect(
      resolveContactValue(
        'PHONE',
        [{ type: 'PHONE', enabled: false, valueOverride: null }],
        sellerPhone,
      ),
    ).toBeNull();
  });

  it('returns null when the method is not configured', () => {
    expect(resolveContactValue('TELEGRAM', [], sellerPhone)).toBeNull();
  });

  it('never falls back to the phone for Telegram', () => {
    expect(
      resolveContactValue(
        'TELEGRAM',
        [{ type: 'TELEGRAM', enabled: true, valueOverride: null }],
        sellerPhone,
      ),
    ).toBeNull();
  });

  it('cannot reveal a phone fallback when the seller has no verified phone', () => {
    const rows: ContactMethodValue[] = [{ type: 'PHONE', enabled: true, valueOverride: null }];
    expect(resolveContactValue('PHONE', rows, null)).toBeNull();
  });
});

describe('DEFAULT_CONTACT_METHODS', () => {
  it('matches the seeded demo configuration (PHONE + WHATSAPP)', () => {
    expect(DEFAULT_CONTACT_METHODS).toEqual([
      { type: 'PHONE', enabled: true, valueOverride: null },
      { type: 'WHATSAPP', enabled: true, valueOverride: null },
    ]);
  });
});
