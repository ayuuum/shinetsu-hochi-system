import { addYears, setMonth, setDate, isAfter, isBefore, getYear, getMonth } from "date-fns";

/**
 * 消防設備士の講習期限計算
 * ルール:
 * 1. 免状交付または受講日の属する年度の翌年度の4月1日から起算
 * 2. 1回目 (Initial): 2年以内
 * 3. 2回目以降 (Subsequent): 5年以内
 * @param baseDate 免状交付日または前回受講日
 * @param isInitial 初回かどうか
 * @returns 次回講習期限日
 */
export function calculateFireDefenseExpiry(baseDate: string | Date, isInitial: boolean = false): Date {
    const date = new Date(baseDate);
    const year = getYear(date);
    const month = getMonth(date); // 0-indexed (April is 3)

    // 属する年度の決定 (4月〜3月)
    let fiscalYear = year;
    if (month < 3) { // 1, 2, 3月は前年度
        fiscalYear = year - 1;
    }

    // 翌年度の4月1日
    const nextFiscalApril1st = setDate(setMonth(new Date(fiscalYear + 1, 3, 1), 3), 1);

    // 期限の加算 (1回目: 2年, 以降: 5年)
    const yearsToAdd = isInitial ? 2 : 5;
    
    // 「起算日から2年以内」=「起算日+2年の年度末（3/31）まで」
    // 例: 起算日 2027/4/1 + 2年 → 2029/3/31 が期限
    return setDate(setMonth(addYears(nextFiscalApril1st, yearsToAdd), 2), 31);
}

/**
 * 一般的な有効期限の計算 (1年後、2年後など)
 * @param baseDate 取得日
 * @param yearsToAdd 有効期間
 */
export function calculateGeneralExpiry(baseDate: string | Date, yearsToAdd: number): Date {
    return addYears(new Date(baseDate), yearsToAdd);
}
