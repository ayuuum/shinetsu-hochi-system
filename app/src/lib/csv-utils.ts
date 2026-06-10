const CSV_INJECTION_START = /^[=+\-@\t\r]/;

/** CSV セルを安全にクォートする。数式インジェクション対策でタブをプレフィックスする */
export function escapeCsvCell(value: unknown): string {
    const str = String(value ?? "");
    const escaped = str.replace(/"/g, '""');
    const safe = CSV_INJECTION_START.test(str) ? `\t${escaped}` : escaped;
    return `"${safe}"`;
}

/** HTML タグ・エンティティ注入を防ぐ */
export function escapeHtmlCell(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
