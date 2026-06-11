// 管理者が発行する初期パスワード・再設定パスワードの生成。
// 紛らわしい文字（0/O, 1/l/I）を除外し、口頭やメモで伝えやすくする。
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&";

function randomInt(maxExclusive: number): number {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
}

function pick(set: string): string {
    return set[randomInt(set.length)];
}

/** 大文字・小文字・数字・記号を各1文字以上含む12文字のパスワードを生成 */
export function generatePassword(): string {
    const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
    const all = UPPER + LOWER + DIGITS + SYMBOLS;
    const rest = Array.from({ length: 8 }, () => pick(all));
    const chars = [...required, ...rest];

    // Fisher-Yates シャッフルで必須文字の位置を分散
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
}
