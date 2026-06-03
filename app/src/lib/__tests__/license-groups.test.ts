import { describe, it, expect } from 'vitest';
import { computeLicenseGroups, computeLicenseGroupRecord, type LicenseGroupInput } from '../license-groups';

function q(overrides: Partial<LicenseGroupInput> & { id: string }): LicenseGroupInput {
    return {
        employee_id: 'emp-1',
        certificate_number: '第100号',
        acquired_date: '2026-04-01',
        created_at: '2026-04-01T00:00:00Z',
        ...overrides,
    };
}

describe('computeLicenseGroups', () => {
    it('免状番号が無い資格はグループに含めない', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', certificate_number: null }),
            q({ id: 'b', certificate_number: '' }),
            q({ id: 'c', certificate_number: '   ' }),
        ]);
        expect(map.size).toBe(0);
    });

    it('同一免状が1件のみの資格はグループ化しない', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', certificate_number: '第1号' }),
            q({ id: 'b', certificate_number: '第2号' }),
        ]);
        expect(map.size).toBe(0);
    });

    it('同じ社員×同じ免状番号でグループ化し、取得日が最新の1件をisLatestにする', () => {
        const map = computeLicenseGroups([
            q({ id: 'old', acquired_date: '2020-04-01' }),
            q({ id: 'new', acquired_date: '2025-04-01' }),
            q({ id: 'mid', acquired_date: '2023-04-01' }),
        ]);
        expect(map.size).toBe(3);
        expect(map.get('new')).toEqual({ groupSize: 3, isLatest: true });
        expect(map.get('old')).toEqual({ groupSize: 3, isLatest: false });
        expect(map.get('mid')).toEqual({ groupSize: 3, isLatest: false });
    });

    it('免状番号は同じでも社員が違えば別グループ扱い', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', employee_id: 'emp-1' }),
            q({ id: 'b', employee_id: 'emp-2' }),
        ]);
        expect(map.size).toBe(0);
    });

    it('免状番号の前後空白は同一とみなす', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', certificate_number: '第100号', acquired_date: '2020-04-01' }),
            q({ id: 'b', certificate_number: ' 第100号 ', acquired_date: '2025-04-01' }),
        ]);
        expect(map.size).toBe(2);
        expect(map.get('b')?.isLatest).toBe(true);
        expect(map.get('a')?.isLatest).toBe(false);
    });

    it('取得日が同じ場合は登録日時が新しい方を最新とする', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', acquired_date: '2025-04-01', created_at: '2025-04-01T00:00:00Z' }),
            q({ id: 'b', acquired_date: '2025-04-01', created_at: '2025-05-01T00:00:00Z' }),
        ]);
        expect(map.get('b')?.isLatest).toBe(true);
        expect(map.get('a')?.isLatest).toBe(false);
    });

    it('取得日が未設定の資格は最新になりにくい（日付ありを優先）', () => {
        const map = computeLicenseGroups([
            q({ id: 'a', acquired_date: null, created_at: '2026-01-01T00:00:00Z' }),
            q({ id: 'b', acquired_date: '2020-04-01', created_at: '2020-04-01T00:00:00Z' }),
        ]);
        expect(map.get('b')?.isLatest).toBe(true);
        expect(map.get('a')?.isLatest).toBe(false);
    });

    it('computeLicenseGroupRecord はプレーンオブジェクトを返す', () => {
        const record = computeLicenseGroupRecord([
            q({ id: 'old', acquired_date: '2020-04-01' }),
            q({ id: 'new', acquired_date: '2025-04-01' }),
        ]);
        expect(record).toEqual({
            old: { groupSize: 2, isLatest: false },
            new: { groupSize: 2, isLatest: true },
        });
    });
});
