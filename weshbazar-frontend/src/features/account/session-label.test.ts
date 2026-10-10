/**
 * Behavior tests for the session device label (§33).
 *
 * The label is the only place a UA string becomes user-facing text, so the
 * tests pin the rule order (Edge/Opera before Chrome, Android before Linux,
 * iOS before Mac) and the honest fallbacks.
 */

import { describeDevice } from './session-label';

const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const WINDOWS_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';
const WINDOWS_OPERA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 OPR/96.0.4693.80';
const LINUX_FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';

describe('describeDevice', () => {
  it('prefers a client-provided device name', () => {
    expect(describeDevice('دفتر کار', WINDOWS_CHROME)).toBe('دفتر کار');
  });

  it('treats a blank device name as absent', () => {
    expect(describeDevice('   ', null)).toBe('دستگاه ناشناس');
  });

  it('summarises browser and platform from the user agent', () => {
    expect(describeDevice(null, ANDROID_CHROME)).toBe('کروم · اندروید');
    expect(describeDevice(null, IPHONE_SAFARI)).toBe('سافاری · آیاواس');
    expect(describeDevice(null, LINUX_FIREFOX)).toBe('فایرفاکس · لینوکس');
    expect(describeDevice(null, MAC_SAFARI)).toBe('سافاری · مک');
  });

  it('recognises Edge and Opera before their Chrome substring', () => {
    expect(describeDevice(null, WINDOWS_EDGE)).toBe('اج · ویندوز');
    expect(describeDevice(null, WINDOWS_OPERA)).toBe('اپرا · ویندوز');
  });

  it('falls back honestly when nothing is recognisable', () => {
    expect(describeDevice(null, null)).toBe('دستگاه ناشناس');
    expect(describeDevice(null, 'curl/8.4.0')).toBe('دستگاه ناشناس');
  });
});
