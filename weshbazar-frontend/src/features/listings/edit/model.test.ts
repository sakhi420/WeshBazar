/**
 * Behavior tests for the Edit Listing model (§42).
 *
 * The diff builder is the safety net here: every field it sends is treated
 * as a material change by the backend (`MATERIAL_CHANGE_FIELDS`), and a
 * wrongly-sent `contactMethods` would replace the stored configuration. The
 * tests pin both behaviors down.
 */

import type { FilterSchemaField } from '@/features/categories';
import type { OwnerListing } from '../types';
import {
  EMPTY_CONTACT_CONFIG,
  attributesEqual,
  buildCategoryOptions,
  buildEditPatch,
  canMutateListingImages,
  isContactDirty,
  readContactConfig,
  seedEditForm,
  toAttributeValues,
} from './model';

const FIELDS: FilterSchemaField[] = [
  {
    field: 'brand',
    label: 'برند',
    type: 'TEXT',
    unit: null,
    placeholder: null,
    required: false,
    filterable: true,
    options: [],
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    operators: [],
  },
  {
    field: 'storage',
    label: 'حافظه',
    type: 'INTEGER',
    unit: 'GB',
    placeholder: null,
    required: false,
    filterable: true,
    options: [],
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    operators: [],
  },
  {
    field: 'features',
    label: 'قابلیت‌ها',
    type: 'MULTI_SELECT',
    unit: null,
    placeholder: null,
    required: false,
    filterable: true,
    options: [
      { value: 'a', label: 'الف' },
      { value: 'b', label: 'ب' },
    ],
    min: null,
    max: null,
    minLength: null,
    maxLength: null,
    pattern: null,
    operators: [],
  },
];

const CONTACT_ROWS = [
  { type: 'PHONE', enabled: true, valueOverride: null },
  { type: 'WHATSAPP', enabled: false, valueOverride: '0770000000' },
  { type: 'TELEGRAM', enabled: false, valueOverride: null },
];

function makeListing(extra: Record<string, unknown> = {}): OwnerListing {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'iphone-13-pro',
    status: 'ACTIVE',
    version: 3,
    title: 'آیفون ۱۳ پرو',
    description: 'توضیح کامل و معتبر برای تست مدل ویرایش آگهی.',
    price: 45000,
    currency: 'AFN',
    pricingType: 'PAID',
    negotiable: true,
    condition: 'GOOD',
    attributes: { brand: 'Apple', features: ['a', 'b'], storage: 256 },
    category: { id: 'cat-mobile', slug: 'mobiles', name: 'موبایل' },
    province: { id: 'prov-1', slug: 'kabul', name: 'کابل' },
    city: { id: 'city-1', slug: 'kabul-city', name: 'کابل' },
    images: [],
    views: 0,
    favoriteCount: 0,
    publishedAt: '2026-10-01T00:00:00.000Z',
    soldAt: null,
    archivedAt: null,
    expiresAt: null,
    rejectedReason: null,
    rejectedNote: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...extra,
  } as unknown as OwnerListing;
}

describe('readContactConfig', () => {
  it('reads the owner contact rows when the response carries them', () => {
    const listing = makeListing({ contactMethods: CONTACT_ROWS });
    expect(readContactConfig(listing)).toEqual({
      phoneEnabled: true,
      whatsappEnabled: false,
      telegramEnabled: false,
      phoneOverride: '',
      whatsappOverride: '0770000000',
      telegramHandle: '',
    });
  });

  it('returns null when the field is missing or not a usable array', () => {
    expect(readContactConfig(makeListing())).toBeNull();
    expect(readContactConfig(makeListing({ contactMethods: [] }))).toBeNull();
    expect(readContactConfig(makeListing({ contactMethods: 'nope' }))).toBeNull();
  });
});

describe('seedEditForm', () => {
  it('maps the owner record onto the form and seed', () => {
    const listing = makeListing({ contactMethods: CONTACT_ROWS });
    const { form, seed } = seedEditForm(listing);

    expect(form.title).toBe('آیفون ۱۳ پرو');
    expect(form.price).toBe('45000');
    expect(form.condition).toBe('GOOD');
    expect(form.categoryId).toBe('cat-mobile');
    expect(form.attributes).toEqual({ brand: 'Apple', features: ['a', 'b'], storage: 256 });
    expect(form.contact.phoneEnabled).toBe(true);
    expect(seed.version).toBe(3);
    expect(seed.contact?.phoneEnabled).toBe(true);
  });

  it('seeds a null price as empty text and an unknown contact as all-off', () => {
    const listing = makeListing({ price: null, pricingType: 'FREE' });
    const { form, seed } = seedEditForm(listing);
    expect(form.price).toBe('');
    expect(form.contact).toEqual(EMPTY_CONTACT_CONFIG);
    expect(seed.contact).toBeNull();
  });
});

describe('toAttributeValues', () => {
  it('keeps only shapes the attribute controls can edit', () => {
    expect(
      toAttributeValues({ a: 'x', b: 5, c: true, d: ['x', 'y'], e: { deep: 1 }, f: null }),
    ).toEqual({ a: 'x', b: 5, c: true, d: ['x', 'y'] });
  });
});

describe('attributesEqual', () => {
  it('treats multi-select arrays as order-free and numbers as loose', () => {
    expect(attributesEqual({ features: ['b', 'a'] }, { features: ['a', 'b'] })).toBe(true);
    expect(attributesEqual({ storage: 256 }, { storage: '256' })).toBe(true);
  });

  it('detects real changes and extra stored keys', () => {
    expect(attributesEqual({ brand: 'Apple' }, { brand: 'Samsung' })).toBe(false);
    expect(attributesEqual({ brand: 'Apple' }, { brand: 'Apple', extra: 'x' })).toBe(false);
  });
});

describe('buildEditPatch', () => {
  it('returns null when the form matches the seed (trim-insensitive)', () => {
    const listing = makeListing({ contactMethods: CONTACT_ROWS });
    const { form, seed } = seedEditForm(listing);
    form.title = ` ${form.title} `;
    expect(buildEditPatch(form, seed, FIELDS)).toBeNull();
  });

  it('sends only the changed field plus expectedVersion', () => {
    const { form, seed } = seedEditForm(makeListing({ contactMethods: CONTACT_ROWS }));
    form.title = 'آیفون ۱۳ پرو مکس';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      title: 'آیفون ۱۳ پرو مکس',
      expectedVersion: 3,
    });
  });

  it('keeps an untouched contact configuration out of the payload', () => {
    const { form, seed } = seedEditForm(makeListing({ contactMethods: CONTACT_ROWS }));
    form.description = 'توضیح تازه و کامل برای این آگهی آزمایشی.';
    const patch = buildEditPatch(form, seed, FIELDS);
    expect(patch).not.toBeNull();
    expect(patch).not.toHaveProperty('contactMethods');
  });

  it('replaces the whole contact set once the seller edits it', () => {
    const { form, seed } = seedEditForm(makeListing({ contactMethods: CONTACT_ROWS }));
    form.contact.telegramEnabled = true;
    form.contact.telegramHandle = '@weshbazar';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      contactMethods: [
        { type: 'PHONE', enabled: true, valueOverride: null },
        { type: 'WHATSAPP', enabled: false, valueOverride: '0770000000' },
        { type: 'TELEGRAM', enabled: true, valueOverride: '@weshbazar' },
      ],
      expectedVersion: 3,
    });
  });

  it('with an unknown contact seed nothing is sent until the seller configures it', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.description = 'توضیح تازه و کامل برای این آگهی آزمایشی.';
    const patch = buildEditPatch(form, seed, FIELDS);
    expect(patch).not.toBeNull();
    expect(patch).not.toHaveProperty('contactMethods');

    form.contact.phoneEnabled = true;
    const touched = buildEditPatch(form, seed, FIELDS);
    expect(touched?.contactMethods).toEqual([
      { type: 'PHONE', enabled: true, valueOverride: null },
      { type: 'WHATSAPP', enabled: false, valueOverride: null },
      { type: 'TELEGRAM', enabled: false, valueOverride: null },
    ]);
  });

  it('a pricing switch sends the tuple with create-parity clearing', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.pricingType = 'FREE';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      pricingType: 'FREE',
      price: null,
      negotiable: false,
      expectedVersion: 3,
    });
  });

  it('a plain price change only touches price', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.price = '۵۰٬۰۰۰';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({ price: 50000, expectedVersion: 3 });
  });

  it('a negotiable toggle only touches negotiable', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.negotiable = false;
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({ negotiable: false, expectedVersion: 3 });
  });

  it('a category switch always re-sends attributes against the new schema', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.categoryId = 'cat-laptop';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      categoryId: 'cat-laptop',
      attributes: { brand: 'Apple', features: ['a', 'b'], storage: 256 },
      expectedVersion: 3,
    });
  });

  it('changed attributes are sent; reordered multi-select is not a change', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.attributes.features = ['b', 'a'];
    expect(buildEditPatch(form, seed, FIELDS)).toBeNull();

    form.attributes.brand = 'Samsung';
    // The payload keeps the form's array order (same as the wizard builder);
    // only presence/values are compared against the seed.
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      attributes: { brand: 'Samsung', features: ['b', 'a'], storage: 256 },
      expectedVersion: 3,
    });
  });

  it('location changes ride as ids only', () => {
    const { form, seed } = seedEditForm(makeListing());
    form.provinceId = 'prov-2';
    form.cityId = 'city-9';
    expect(buildEditPatch(form, seed, FIELDS)).toEqual({
      provinceId: 'prov-2',
      cityId: 'city-9',
      expectedVersion: 3,
    });
  });
});

describe('canMutateListingImages', () => {
  it('mirrors the backend IMAGE_MUTABLE_STATUSES', () => {
    for (const status of ['DRAFT', 'REJECTED', 'ACTIVE', 'PENDING_REVIEW'] as const) {
      expect(canMutateListingImages(status)).toBe(true);
    }
    expect(canMutateListingImages('SOLD')).toBe(false);
    expect(canMutateListingImages('ARCHIVED')).toBe(false);
  });
});

describe('isContactDirty', () => {
  it('unknown seed: only an explicitly configured set counts as dirt', () => {
    expect(isContactDirty({ ...EMPTY_CONTACT_CONFIG }, null)).toBe(false);
    expect(isContactDirty({ ...EMPTY_CONTACT_CONFIG, phoneEnabled: true }, null)).toBe(true);
  });
});

describe('buildCategoryOptions', () => {
  it('labels rows by full path and keeps only leaves selectable', () => {
    const options = buildCategoryOptions([
      {
        id: 'root',
        slug: 'electronics',
        name: 'الکترونیک',
        iconKey: null,
        parentId: null,
        sortOrder: 1,
        hasChildren: true,
      },
      {
        id: 'child',
        slug: 'mobiles',
        name: 'موبایل',
        iconKey: null,
        parentId: 'root',
        sortOrder: 1,
        hasChildren: false,
      },
    ]);
    expect(options).toEqual([
      { id: 'root', label: 'الکترونیک', selectable: false },
      { id: 'child', label: 'الکترونیک / موبایل', selectable: true },
    ]);
  });
});
