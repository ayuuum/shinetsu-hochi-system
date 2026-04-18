const TOKYO_TIME_ZONE = "Asia/Tokyo";
const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export function formatDateInTokyo(value: Date | string | number): string {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: TOKYO_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

export function getTodayInTokyo(): string {
    return formatDateInTokyo(new Date());
}

/** `todayYmd`（YYYY-MM-DD・東京日付）が属する暦月の開始日・終了日（同一形式） */
export function getTokyoCalendarMonthBounds(todayYmd: string): { start: string; end: string } {
    const [yStr, mStr] = todayYmd.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${yStr}-${mStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${yStr}-${mStr}-${pad(lastDay)}`;
    return { start, end };
}

export function isYmdInInclusiveRange(value: string | null | undefined, start: string, end: string) {
    if (!value) return false;
    return value >= start && value <= end;
}

export function formatDisplayDate(
    value: Date | string | number | null | undefined,
    fallback = "-",
): string {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }

    return DISPLAY_DATE_FORMATTER.format(date);
}
