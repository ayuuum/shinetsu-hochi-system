const TOKYO_TIME_ZONE = "Asia/Tokyo";

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
