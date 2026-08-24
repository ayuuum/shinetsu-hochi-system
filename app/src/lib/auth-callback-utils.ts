export function getSafeAuthNextPath(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    return value;
}

export function buildAuthCallbackRedirectUrl(origin: string, nextPath: string) {
    if (nextPath === "/auth/update-password") {
        return `${origin.replace(/\/$/, "")}/api/auth/callback/recovery`;
    }

    return `${origin.replace(/\/$/, "")}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
