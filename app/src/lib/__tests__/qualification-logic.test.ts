import { describe, it, expect } from 'vitest';
import { calculateFireDefenseExpiry, calculateGeneralExpiry } from '../qualification-logic';
import { format } from 'date-fns';

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

describe('calculateFireDefenseExpiry', () => {
  describe('初回取得 (isInitial=true) — 起算日+2年の年度末', () => {
    it('4月以降の取得 → 翌年度4/1起算、+2年の3/31', () => {
      // 2025年6月1日取得 → 年度=2025 → 起算日=2026/4/1 → +2年=2028/3/31
      const result = calculateFireDefenseExpiry('2025-06-01', true);
      expect(fmt(result)).toBe('2028-03-31');
    });

    it('1-3月の取得 → 前年度扱い', () => {
      // 2026年2月15日取得 → 年度=2025(前年度) → 起算日=2026/4/1 → +2年=2028/3/31
      const result = calculateFireDefenseExpiry('2026-02-15', true);
      expect(fmt(result)).toBe('2028-03-31');
    });

    it('3月31日取得 → 前年度扱い', () => {
      // 2026年3月31日 → 年度=2025 → 起算日=2026/4/1 → +2年=2028/3/31
      const result = calculateFireDefenseExpiry('2026-03-31', true);
      expect(fmt(result)).toBe('2028-03-31');
    });

    it('4月1日取得 — エッジケース: その年度の4/1が起算日になるべき', () => {
      // 2026年4月1日取得 → 年度=2026 → 起算日=2027/4/1 → +2年=2029/3/31
      // ※PRDの定義: 「免状交付日以降の最初の4/1」
      // 4/1当日取得の場合、「以降の最初の4/1」は翌年度の4/1
      const result = calculateFireDefenseExpiry('2026-04-01', true);
      expect(fmt(result)).toBe('2029-03-31');
    });

    it('12月取得', () => {
      // 2025年12月1日 → 年度=2025 → 起算日=2026/4/1 → +2年=2028/3/31
      const result = calculateFireDefenseExpiry('2025-12-01', true);
      expect(fmt(result)).toBe('2028-03-31');
    });

    it('1月1日取得', () => {
      // 2026年1月1日 → 年度=2025 → 起算日=2026/4/1 → +2年=2028/3/31
      const result = calculateFireDefenseExpiry('2026-01-01', true);
      expect(fmt(result)).toBe('2028-03-31');
    });
  });

  describe('2回目以降 (isInitial=false) — 起算日+5年の年度末', () => {
    it('4月以降の受講 → 翌年度4/1起算、+5年の3/31', () => {
      // 2025年6月1日受講 → 年度=2025 → 起算日=2026/4/1 → +5年=2031/3/31
      const result = calculateFireDefenseExpiry('2025-06-01', false);
      expect(fmt(result)).toBe('2031-03-31');
    });

    it('1-3月の受講 → 前年度扱い', () => {
      // 2026年2月15日受講 → 年度=2025 → 起算日=2026/4/1 → +5年=2031/3/31
      const result = calculateFireDefenseExpiry('2026-02-15', false);
      expect(fmt(result)).toBe('2031-03-31');
    });

    it('4月1日受講 — エッジケース', () => {
      // 2026年4月1日受講 → 年度=2026 → 起算日=2027/4/1 → +5年=2032/3/31
      const result = calculateFireDefenseExpiry('2026-04-01', false);
      expect(fmt(result)).toBe('2032-03-31');
    });
  });

  describe('Date型入力', () => {
    it('Date型でも正しく計算', () => {
      const result = calculateFireDefenseExpiry(new Date(2025, 5, 1), true); // June 1, 2025
      expect(fmt(result)).toBe('2028-03-31');
    });
  });
});

describe('calculateGeneralExpiry', () => {
  it('5年後', () => {
    const result = calculateGeneralExpiry('2025-06-01', 5);
    expect(fmt(result)).toBe('2030-06-01');
  });

  it('3年後', () => {
    const result = calculateGeneralExpiry('2025-06-01', 3);
    expect(fmt(result)).toBe('2028-06-01');
  });

  it('閏年跨ぎ: 2月29日 + 1年', () => {
    const result = calculateGeneralExpiry('2024-02-29', 1);
    // date-fns addYears handles Feb 29 → Feb 28 in non-leap year
    expect(fmt(result)).toBe('2025-02-28');
  });

  it('Date型入力', () => {
    const result = calculateGeneralExpiry(new Date(2025, 0, 15), 5);
    expect(fmt(result)).toBe('2030-01-15');
  });
});
