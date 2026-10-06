import { parseDurationSeconds } from './duration.utils';

describe('parseDurationSeconds', () => {
  it('parses minutes, hours, days and seconds', () => {
    expect(parseDurationSeconds('15m')).toBe(900);
    expect(parseDurationSeconds('24h')).toBe(86_400);
    expect(parseDurationSeconds('30d')).toBe(2_592_000);
    expect(parseDurationSeconds('3600s')).toBe(3600);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseDurationSeconds(' 15m ')).toBe(900);
  });

  it('throws for values without a unit', () => {
    expect(() => parseDurationSeconds('900')).toThrow(/Invalid duration/);
  });

  it('throws for unknown units and malformed input', () => {
    expect(() => parseDurationSeconds('15x')).toThrow(/Invalid duration/);
    expect(() => parseDurationSeconds('m15')).toThrow(/Invalid duration/);
    expect(() => parseDurationSeconds('')).toThrow(/Invalid duration/);
  });
});
