import { describe, it, expect } from 'vitest';
import {
    computeCurrentExperience,
    fiscalYearStartOnOrBefore,
    formatExperience,
} from '../experience';

describe('fiscalYearStartOnOrBefore', () => {
    it('4月以降はその年の4月1日', () => {
        expect(fiscalYearStartOnOrBefore(new Date('2026-06-03'))).toBe('2026-04-01');
        expect(fiscalYearStartOnOrBefore(new Date('2026-04-01'))).toBe('2026-04-01');
    });
    it('1〜3月は前年の4月1日', () => {
        expect(fiscalYearStartOnOrBefore(new Date('2026-03-31'))).toBe('2025-04-01');
        expect(fiscalYearStartOnOrBefore(new Date('2026-01-15'))).toBe('2025-04-01');
    });
});

describe('computeCurrentExperience', () => {
    it('基準値が未入力なら null', () => {
        expect(computeCurrentExperience(null, null, '2025-04-01')).toBeNull();
        expect(computeCurrentExperience(undefined, undefined, undefined)).toBeNull();
    });

    it('基準日時点の値に経過月数を加算する', () => {
        // 基準: 2025/4/1 時点で10年0ヶ月 → 2026/6/3 時点では +1年2ヶ月
        const result = computeCurrentExperience(10, 0, '2025-04-01', new Date('2026-06-03'));
        expect(result).toEqual({ years: 11, months: 2, totalMonths: 134 });
    });

    it('応当日（基準日の日）に達した月数だけ加算する', () => {
        // 4/1 → 5/1 は応当日1回（5/1）に到達 → 1ヶ月
        expect(computeCurrentExperience(0, 0, '2026-04-01', new Date('2026-05-01'))).toEqual({
            years: 0,
            months: 1,
            totalMonths: 1,
        });
        // 4/1 → 5/31 は次の応当日（6/1）未到達 → まだ1ヶ月
        expect(computeCurrentExperience(0, 0, '2026-04-01', new Date('2026-05-31'))).toEqual({
            years: 0,
            months: 1,
            totalMonths: 1,
        });
        // 4/15 → 5/10 は応当日（5/15）未到達 → 0ヶ月
        expect(computeCurrentExperience(0, 0, '2026-04-15', new Date('2026-05-10'))).toEqual({
            years: 0,
            months: 0,
            totalMonths: 0,
        });
        // 4/15 → 5/20 は応当日（5/15）到達 → 1ヶ月
        expect(computeCurrentExperience(0, 0, '2026-04-15', new Date('2026-05-20'))).toEqual({
            years: 0,
            months: 1,
            totalMonths: 1,
        });
    });

    it('月数が12に達したら年に繰り上がる', () => {
        // 基準: 2025/4/1 時点で0年11ヶ月 → +1ヶ月で1年0ヶ月
        const result = computeCurrentExperience(0, 11, '2025-04-01', new Date('2025-05-01'));
        expect(result).toEqual({ years: 1, months: 0, totalMonths: 12 });
    });

    it('基準日が未指定なら基準値のみを返す', () => {
        expect(computeCurrentExperience(5, 3, null)).toEqual({ years: 5, months: 3, totalMonths: 63 });
    });

    it('基準日が未来でもマイナスにはならない', () => {
        const result = computeCurrentExperience(2, 0, '2030-04-01', new Date('2026-06-03'));
        expect(result).toEqual({ years: 2, months: 0, totalMonths: 24 });
    });
});

describe('formatExperience', () => {
    it('null は "-"', () => {
        expect(formatExperience(null)).toBe('-');
    });
    it('〇年〇ヶ月形式', () => {
        expect(formatExperience({ years: 11, months: 2, totalMonths: 134 })).toBe('11年2ヶ月');
    });
});
