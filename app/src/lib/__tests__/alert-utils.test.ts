import { describe, it, expect } from 'vitest';
import { getAlertLevel, getDaysRemaining } from '../alert-utils';

const fixed = new Date('2026-03-25');

describe('getAlertLevel', () => {
  it('null → ok', () => {
    expect(getAlertLevel(null, fixed)).toBe('ok');
  });

  it('期限切れ (yesterday) → danger', () => {
    expect(getAlertLevel('2026-03-24', fixed)).toBe('danger');
  });

  it('今日 (0日残) → urgent', () => {
    // differenceInDays('2026-03-25', '2026-03-25') = 0, which is <= 14
    expect(getAlertLevel('2026-03-25', fixed)).toBe('urgent');
  });

  it('14日以内 → urgent', () => {
    expect(getAlertLevel('2026-04-08', fixed)).toBe('urgent');
  });

  it('15日後 → warning', () => {
    expect(getAlertLevel('2026-04-09', fixed)).toBe('warning');
  });

  it('30日以内 → warning', () => {
    expect(getAlertLevel('2026-04-24', fixed)).toBe('warning');
  });

  it('31日後 → info', () => {
    expect(getAlertLevel('2026-04-25', fixed)).toBe('info');
  });

  it('60日以内 → info', () => {
    expect(getAlertLevel('2026-05-24', fixed)).toBe('info');
  });

  it('61日後 → ok', () => {
    expect(getAlertLevel('2026-05-25', fixed)).toBe('ok');
  });

  it('大幅に過去 → danger', () => {
    expect(getAlertLevel('2025-01-01', fixed)).toBe('danger');
  });

  it('大幅に未来 → ok', () => {
    expect(getAlertLevel('2030-01-01', fixed)).toBe('ok');
  });
});

describe('getDaysRemaining', () => {
  it('明日 → 1', () => {
    expect(getDaysRemaining('2026-03-26', fixed)).toBe(1);
  });

  it('昨日 → -1', () => {
    expect(getDaysRemaining('2026-03-24', fixed)).toBe(-1);
  });

  it('今日 → 0', () => {
    expect(getDaysRemaining('2026-03-25', fixed)).toBe(0);
  });
});
