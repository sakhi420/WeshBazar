/**
 * Sell step registry + navigation math (§34–§41).
 */

import {
  FLOW_STEP_COUNT,
  flowStepPosition,
  isFlowStepKey,
  isSellStepKey,
  nextStepKey,
  nextStepPath,
  resumeStepKey,
  sellStepPath,
} from './sell-steps';

describe('sell step registry', () => {
  it('maps every step to its §34–§41 route', () => {
    expect(sellStepPath('start')).toBe('/sell');
    expect(sellStepPath('photos')).toBe('/sell/photos');
    expect(sellStepPath('basic')).toBe('/sell/basic');
    expect(sellStepPath('attributes')).toBe('/sell/attributes');
    expect(sellStepPath('location')).toBe('/sell/location');
    expect(sellStepPath('contact')).toBe('/sell/contact');
    expect(sellStepPath('preview')).toBe('/sell/preview');
    expect(sellStepPath('submit')).toBe('/sell/submit');
  });

  it('numbers the six flow steps for «گام X از ۶»', () => {
    expect(FLOW_STEP_COUNT).toBe(6);
    expect(flowStepPosition('photos')).toBe(1);
    expect(flowStepPosition('contact')).toBe(5);
    expect(flowStepPosition('preview')).toBe(6);
    expect(flowStepPosition('start')).toBeNull();
    expect(flowStepPosition('submit')).toBeNull();
  });

  it('walks the flow forward and stops before the submit outcome', () => {
    expect(nextStepPath('start')).toBe('/sell/photos');
    expect(nextStepKey('photos')).toBe('basic');
    expect(nextStepKey('location')).toBe('contact');
    expect(nextStepKey('contact')).toBe('preview');
    expect(nextStepKey('preview')).toBeNull();
    expect(nextStepKey('submit')).toBeNull();
  });

  it('resumes after the last completed step, clamped at preview', () => {
    expect(resumeStepKey(null)).toBe('photos');
    expect(resumeStepKey('start')).toBe('photos');
    expect(resumeStepKey('photos')).toBe('basic');
    expect(resumeStepKey('contact')).toBe('preview');
    expect(resumeStepKey('preview')).toBe('preview');
    expect(resumeStepKey('submit')).toBe('preview');
  });

  it('narrows stored values defensively', () => {
    expect(isSellStepKey('location')).toBe(true);
    expect(isSellStepKey('edit')).toBe(false);
    expect(isSellStepKey(7)).toBe(false);
    expect(isFlowStepKey('preview')).toBe(true);
    expect(isFlowStepKey('start')).toBe(false);
  });
});
