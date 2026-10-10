/**
 * Sell wizard — step registry and navigation math (master prompt §34–§41,
 * §138). Pure module: route paths, Persian labels and ordering only — no
 * React, no HTTP, so steps stay testable and the stepper stays presentational.
 */

/** Every route of the sell flow in journey order. */
export const SELL_STEP_KEYS = [
  'start',
  'photos',
  'basic',
  'attributes',
  'location',
  'contact',
  'preview',
  'submit',
] as const;

export type SellStepKey = (typeof SELL_STEP_KEYS)[number];

/** The six wizard steps surfaced in the progress stepper (§138). */
export const FLOW_STEP_KEYS = [
  'photos',
  'basic',
  'attributes',
  'location',
  'contact',
  'preview',
] as const;

export type FlowStepKey = (typeof FLOW_STEP_KEYS)[number];

/** Path + label for one step of the flow. */
export interface SellStep {
  key: SellStepKey;
  path: string;
  /** Short Persian label (stepper chips + progress announcements). */
  label: string;
}

export const SELL_STEPS: Readonly<Record<SellStepKey, SellStep>> = {
  start: { key: 'start', path: '/sell', label: 'دستهٔ کالا' },
  photos: { key: 'photos', path: '/sell/photos', label: 'تصاویر' },
  basic: { key: 'basic', path: '/sell/basic', label: 'مشخصات' },
  attributes: { key: 'attributes', path: '/sell/attributes', label: 'ویژگی‌ها' },
  location: { key: 'location', path: '/sell/location', label: 'موقعیت' },
  contact: { key: 'contact', path: '/sell/contact', label: 'تماس' },
  preview: { key: 'preview', path: '/sell/preview', label: 'پیش‌نمایش' },
  submit: { key: 'submit', path: '/sell/submit', label: 'ثبت' },
};

/** Step count announced as «گام X از ۶». */
export const FLOW_STEP_COUNT = FLOW_STEP_KEYS.length;

/** Route path of a step (redirects, links). */
export function sellStepPath(key: SellStepKey): string {
  return SELL_STEPS[key].path;
}

/** Persian label of a step (stepper chips, progress text). */
export function sellStepLabel(key: SellStepKey): string {
  return SELL_STEPS[key].label;
}

/** Narrows stored/unknown values to a valid step key. */
export function isSellStepKey(value: unknown): value is SellStepKey {
  return typeof value === 'string' && (SELL_STEP_KEYS as readonly string[]).includes(value);
}

/** Narrows unknown values to one of the six stepper steps. */
export function isFlowStepKey(value: unknown): value is FlowStepKey {
  return typeof value === 'string' && (FLOW_STEP_KEYS as readonly string[]).includes(value);
}

/** 1-based position inside the six flow steps; null outside the flow. */
export function flowStepPosition(key: SellStepKey): number | null {
  const index = (FLOW_STEP_KEYS as readonly string[]).indexOf(key);
  return index === -1 ? null : index + 1;
}

/**
 * The step that follows a completed one. `preview` deliberately returns null:
 * the §41 outcome is reached through the submit action (`POST …/submit`),
 * not a plain route hop, because it needs the listing id in the query.
 */
export function nextStepKey(current: SellStepKey): SellStepKey | null {
  switch (current) {
    case 'start':
      return 'photos';
    case 'photos':
      return 'basic';
    case 'basic':
      return 'attributes';
    case 'attributes':
      return 'location';
    case 'location':
      return 'contact';
    case 'contact':
      return 'preview';
    case 'preview':
    case 'submit':
      return null;
  }
}

/** Route path of the next step; null when the flow ends (§41). */
export function nextStepPath(current: SellStepKey): string | null {
  const next = nextStepKey(current);
  return next === null ? null : sellStepPath(next);
}

/**
 * Where a stored draft continues (§139): the step after the last completed
 * one, clamped at `preview` — a successful submit clears the draft instead of
 * advancing past it.
 */
export function resumeStepKey(completedStep: SellStepKey | null): FlowStepKey {
  if (completedStep === null || completedStep === 'start') return 'photos';
  if (completedStep === 'submit') return 'preview';
  const index = (FLOW_STEP_KEYS as readonly string[]).indexOf(completedStep);
  if (index === -1) return 'photos';
  return FLOW_STEP_KEYS[Math.min(index + 1, FLOW_STEP_COUNT - 1)] ?? 'preview';
}
