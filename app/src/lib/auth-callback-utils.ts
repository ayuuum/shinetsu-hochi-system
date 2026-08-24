export function getSafeAuthNextPath(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    return value;
}

export function buildAuthCallbackRedirectUrl(origin: string, nextPath: string) {
    const base = `${origin.replace(/\/$/, "")}/api/auth/callback`;

    // パスワード再設定は next クエリなしの /api/auth/callback を使う。
    // Supabase の Redirect URL 設定で ?next= が落ちることがあるため、
    // コールバック側のデフォルト遷移先を /auth/update-password にしている。
    if (nextPath === "/auth/update-password") {
        return base;
    }

    return `${base}?next=${encodeURIComponent(nextPath)}`;
}
