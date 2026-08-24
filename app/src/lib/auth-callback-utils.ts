export function getSafeAuthNextPath(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    return value;
}

export function buildAuthCallbackRedirectUrl(origin: string, nextPath: string) {
    return `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
