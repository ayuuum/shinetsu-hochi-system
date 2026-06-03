/**
 * 経験年数の自動加算ロジック。
 *
 * 「基準日（通常は年度開始の4月1日）時点の経験年数・月数」を保存しておき、
 * 表示時に基準日から現在までの経過月数を足し込むことで、年数・月数が
 * 自動で増えていくようにする。
 */

export interface ExperienceResult {
    years: number;
    months: number;
    /** 合計月数（並び替え・比較用） */
    totalMonths: number;
}

/**
 * 指定日（既定は今日）の属する年度開始日（直近の4月1日）を YYYY-MM-DD で返す。
 * 1〜3月は前年の4月1日が年度開始となる。
 */
export function fiscalYearStartOnOrBefore(date: Date = new Date()): string {
    const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `${year}-04-01`;
}

/**
 * 基準日時点の経験年数・月数に、基準日から現在までの経過分を加算して返す。
 * 基準値（年数・月数とも）が未入力の場合は null を返す。
 *
 * @param baseYears 基準日時点の年数
 * @param baseMonths 基準日時点の月数
 * @param baseDate 基準日（YYYY-MM-DD）。未指定なら加算せず基準値のみ
 * @param now 現在日時（テスト用に注入可能）
 */
export function computeCurrentExperience(
    baseYears: number | null | undefined,
    baseMonths: number | null | undefined,
    baseDate: string | null | undefined,
    now: Date = new Date(),
): ExperienceResult | null {
    if (baseYears == null && baseMonths == null) {
        return null;
    }

    let totalMonths = (baseYears ?? 0) * 12 + (baseMonths ?? 0);

    if (baseDate) {
        const base = new Date(`${baseDate}T00:00:00`);
        if (!Number.isNaN(base.getTime())) {
            let elapsed =
                (now.getFullYear() - base.getFullYear()) * 12 +
                (now.getMonth() - base.getMonth());
            // 当月の途中（基準日の「日」に未達）はまだ1か月経過していない
            if (now.getDate() < base.getDate()) {
                elapsed -= 1;
            }
            if (elapsed > 0) {
                totalMonths += elapsed;
            }
        }
    }

    if (totalMonths < 0) {
        totalMonths = 0;
    }

    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
        totalMonths,
    };
}

/** 経験年数を「〇年〇ヶ月」形式の文字列にする。null は "-"。 */
export function formatExperience(result: ExperienceResult | null): string {
    if (!result) return "-";
    return `${result.years}年${result.months}ヶ月`;
}
