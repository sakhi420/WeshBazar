/**
 * Sell draft tests (§34–§41, §139): defaults, defensive storage parsing,
 * payload builders and step prerequisites.
 */

import type { FilterSchemaField } from '@/features/categories';
import type { OwnerListing } from '../types';
import {
  SELL_DRAFT_STORAGE_KEY,
  scopedDraftStorageKey,
  clearSellDraftForUser,
  buildListingCreatePayload,
  buildListingUpdatePayload,
  contactMethodsFromDraft,
  createEmptyDraft,
  draftHasProgress,
  mergeOwnerListing,
  parseStoredDraft,
  serializeDraft,
  toPreviewAttributes,
  type SellDraft,
} from './draft';
import { hasBasicInfo, missingPrerequisite } from './guards';

function field(
  overrides: Partial<FilterSchemaField> & Pick<FilterSchemaField, 'field' | 'type'>,
): FilterSchemaField {
  return {
    label: overrides.field,
    unit: null,
    placeholder: null,
    required: false,
    filterable: false,
    options: [],
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    operators: [],
    ...overrides,
  };
}

const schema: FilterSchemaField[] = [
  field({ field: 'brand', type: 'TEXT', label: 'برند' }),
  field({ field: 'ram', type: 'INTEGER', label: 'رم' }),
  field({ field: 'releaseYear', type: 'YEAR', label: 'سال عرضه' }),
  field({
    field: 'tags',
    type: 'MULTI_SELECT',
    label: 'برچسب‌ها',
    options: [
      { value: 'gaming', label: 'گیمینگ' },
      { value: 'office', label: 'اداری' },
    ],
  }),
];

function completeDraft(): SellDraft {
  return {
    ...createEmptyDraft(),
    categoryId: 'cat-1',
    categoryName: 'موبایل و تبلت',
    title: 'گوشی سامسونگ گلکسی A54',
    description: 'این دستگاه کاملاً سالم است و هیچ خط و خش ندارد. جعبه و لوازم همراه.',
    condition: 'GOOD',
    pricingType: 'PAID',
    price: '۴۵٬۰۰۰',
    negotiable: true,
    attributes: { brand: 'سامسونگ', ram: '۱۲۸' },
    provinceId: 'prov-1',
    provinceName: 'کابل',
    cityId: 'city-1',
    cityName: 'کابل',
  };
}

describe('createEmptyDraft', () => {
  it('starts with backend-matching defaults', () => {
    const draft = createEmptyDraft();
    expect(draft.pricingType).toBe('PAID');
    expect(draft.contact.phoneEnabled).toBe(true);
    expect(draft.contact.whatsappEnabled).toBe(true);
    expect(draft.contact.telegramEnabled).toBe(false);
    expect(draft.completedStep).toBeNull();
    expect(draft.listingId).toBeNull();
    expect(draft.listingVersion).toBeNull();
    expect(draft.attributes).toEqual({});
    expect(Number.isNaN(Date.parse(draft.updatedAt))).toBe(false);
    expect(SELL_DRAFT_STORAGE_KEY).toContain('sell-draft');
  });
});

describe('storage (§139)', () => {
  it('round-trips a draft through serialize/parse', () => {
    const draft: SellDraft = {
      ...completeDraft(),
      attributes: { ram: '۱۲۸', tags: ['gaming'], original: true },
      completedStep: 'contact',
      listingId: 'listing-1',
      listingVersion: 3,
    };
    expect(parseStoredDraft(serializeDraft(draft))).toEqual(draft);
  });

  it('returns null for empty or unusable storage', () => {
    expect(parseStoredDraft(null)).toBeNull();
    expect(parseStoredDraft('')).toBeNull();
    expect(parseStoredDraft('{nope')).toBeNull();
    expect(parseStoredDraft('[]')).toBeNull();
    expect(parseStoredDraft('"text"')).toBeNull();
  });

  it('sanitizes corrupted fields instead of crashing', () => {
    const parsed = parseStoredDraft(
      JSON.stringify({
        title: 7,
        condition: 'WHAT',
        pricingType: 'BARTER',
        price: null,
        attributes: { ok: 'x', bad: { deep: 1 }, list: ['a', 2] },
        contact: null,
        completedStep: 'edit',
        listingVersion: 0,
      }),
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe('');
    expect(parsed?.condition).toBeNull();
    expect(parsed?.pricingType).toBe('PAID');
    expect(parsed?.attributes).toEqual({ ok: 'x' });
    expect(parsed?.contact.phoneEnabled).toBe(true);
    expect(parsed?.completedStep).toBeNull();
    expect(parsed?.listingVersion).toBeNull();
  });
});

describe('draftHasProgress', () => {
  it('detects drafts worth restoring', () => {
    expect(draftHasProgress(createEmptyDraft())).toBe(false);
    expect(draftHasProgress({ ...createEmptyDraft(), categoryId: 'cat-1' })).toBe(true);
    expect(draftHasProgress({ ...createEmptyDraft(), title: 'گوشی' })).toBe(true);
    expect(draftHasProgress({ ...createEmptyDraft(), title: '   ' })).toBe(false);
  });
});

describe('contactMethodsFromDraft (§53)', () => {
  it('sends the complete set with null fallbacks by default', () => {
    expect(contactMethodsFromDraft(createEmptyDraft().contact)).toEqual([
      { type: 'PHONE', enabled: true, valueOverride: null },
      { type: 'WHATSAPP', enabled: true, valueOverride: null },
      { type: 'TELEGRAM', enabled: false, valueOverride: null },
    ]);
  });

  it('normalizes overrides and canonicalizes the Telegram handle', () => {
    const methods = contactMethodsFromDraft({
      phoneEnabled: true,
      whatsappEnabled: false,
      telegramEnabled: true,
      phoneOverride: '۰۷۰۱۲۳۴۵۶۷',
      whatsappOverride: '',
      telegramHandle: 'wesh_bazar',
    });
    expect(methods[0]).toEqual({ type: 'PHONE', enabled: true, valueOverride: '0701234567' });
    expect(methods[1]).toEqual({ type: 'WHATSAPP', enabled: false, valueOverride: null });
    expect(methods[2]).toEqual({ type: 'TELEGRAM', enabled: true, valueOverride: '@wesh_bazar' });
  });
});

describe('payload builders (§45)', () => {
  it('returns null while required pieces are missing', () => {
    expect(buildListingCreatePayload(createEmptyDraft(), schema)).toBeNull();
    expect(
      buildListingCreatePayload({ ...createEmptyDraft(), categoryId: 'cat-1' }, schema),
    ).toBeNull();
  });

  it('builds a PAID create payload with coerced attributes', () => {
    const payload = buildListingCreatePayload(
      { ...completeDraft(), attributes: { brand: 'سامسونگ', ram: '۱۲۸', unknown: 'drop' } },
      schema,
    );
    expect(payload).not.toBeNull();
    expect(payload?.title).toBe('گوشی سامسونگ گلکسی A54');
    expect(payload?.price).toBe(45000);
    expect(payload?.currency).toBe('AFN');
    expect(payload?.negotiable).toBe(true);
    expect(payload?.attributes).toEqual({ brand: 'سامسونگ', ram: 128 });
    expect(payload?.contactMethods).toHaveLength(3);
  });

  it('nulls the price for FREE and CONTACT', () => {
    const free = buildListingCreatePayload(
      { ...completeDraft(), pricingType: 'FREE', price: '۱۰۰' },
      schema,
    );
    expect(free?.price).toBeNull();
    expect(free?.negotiable).toBe(false);
    const contact = buildListingCreatePayload(
      { ...completeDraft(), pricingType: 'CONTACT' },
      schema,
    );
    expect(contact?.price).toBeNull();
  });

  it('refuses PAID without a positive price', () => {
    expect(buildListingCreatePayload({ ...completeDraft(), price: '' }, schema)).toBeNull();
    expect(buildListingCreatePayload({ ...completeDraft(), price: '۰' }, schema)).toBeNull();
  });

  it('adds expectedVersion to PATCH payloads when known', () => {
    expect(buildListingUpdatePayload(completeDraft(), schema)?.expectedVersion).toBeUndefined();
    expect(
      buildListingUpdatePayload({ ...completeDraft(), listingVersion: 4 }, schema)?.expectedVersion,
    ).toBe(4);
  });
});

describe('mergeOwnerListing', () => {
  it('links the server draft after create/PATCH (§43)', () => {
    const merged = mergeOwnerListing(completeDraft(), {
      id: 'listing-9',
      version: 2,
    } as OwnerListing);
    expect(merged.listingId).toBe('listing-9');
    expect(merged.listingVersion).toBe(2);
  });
});

describe('toPreviewAttributes', () => {
  it('builds preview attributes from the live schema', () => {
    expect(
      toPreviewAttributes({ brand: 'سامسونگ', ram: '۱۲۸', unknown: 'drop' }, schema),
    ).toEqual([
      { key: 'brand', label: 'برند', type: 'TEXT', value: 'سامسونگ' },
      { key: 'ram', label: 'رم', type: 'INTEGER', value: 128 },
    ]);
  });
});

describe('step prerequisites (§34–§41)', () => {
  it('sends empty drafts back to the start', () => {
    const draft = createEmptyDraft();
    expect(missingPrerequisite('photos', draft)).toBe('start');
    expect(missingPrerequisite('basic', draft)).toBe('start');
    expect(missingPrerequisite('attributes', draft)).toBe('start');
    expect(missingPrerequisite('location', draft)).toBe('start');
    expect(missingPrerequisite('preview', draft)).toBe('start');
  });

  it('requires valid basic info before the location step', () => {
    const withCategory = { ...createEmptyDraft(), categoryId: 'cat-1' };
    expect(missingPrerequisite('photos', withCategory)).toBeNull();
    expect(missingPrerequisite('location', withCategory)).toBe('basic');
    expect(missingPrerequisite('location', { ...completeDraft(), title: 'کوتاه' })).toBe('basic');
    expect(missingPrerequisite('location', completeDraft())).toBeNull();
  });

  it('requires the server draft before contact and preview', () => {
    expect(missingPrerequisite('contact', completeDraft())).toBe('location');
    expect(missingPrerequisite('preview', completeDraft())).toBe('location');
    const linked = { ...completeDraft(), listingId: 'listing-1', listingVersion: 1 };
    expect(missingPrerequisite('contact', linked)).toBeNull();
    expect(missingPrerequisite('preview', linked)).toBeNull();
    expect(missingPrerequisite('submit', linked)).toBeNull();
  });

  it('validates basic info independently of the server link', () => {
    expect(hasBasicInfo(completeDraft())).toBe(true);
    expect(hasBasicInfo({ ...completeDraft(), price: '' })).toBe(false);
    expect(hasBasicInfo({ ...completeDraft(), pricingType: 'FREE' })).toBe(true);
  });
});

describe('owner-scoped isolation (§437)', () => {
  const USER_A = 'user-a-123';
  const USER_B = 'user-b-456';

  it('scopes the storage key to the owner', () => {
    expect(scopedDraftStorageKey(USER_A)).toBe('weshbazar.sell-draft.v1.user-a-123');
    expect(scopedDraftStorageKey(USER_B)).not.toBe(scopedDraftStorageKey(USER_A));
  });

  it('clearSellDraftForUser removes only the targeted account draft', () => {
    const draftA = completeDraft();
    const draftB = { ...completeDraft(), title: 'B user ad' };

    window.localStorage.setItem(scopedDraftStorageKey(USER_A), serializeDraft(draftA));
    window.localStorage.setItem(scopedDraftStorageKey(USER_B), serializeDraft(draftB));

    clearSellDraftForUser(USER_A);

    expect(window.localStorage.getItem(scopedDraftStorageKey(USER_A))).toBeNull();
    expect(window.localStorage.getItem(scopedDraftStorageKey(USER_B))).not.toBeNull();
  });

  afterEach(() => {
    window.localStorage.removeItem(scopedDraftStorageKey(USER_A));
    window.localStorage.removeItem(scopedDraftStorageKey(USER_B));
  });
});
