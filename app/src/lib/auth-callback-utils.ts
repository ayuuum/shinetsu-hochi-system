import { PASSWORD_RESET_NEXT_PATH, getPasswordResetCallbackUrl } from "@/lib/auth-recovery";

export function getSafeAuthNextPath(value: string | null, fallback = PASSWORD_RESET_NEXT_PATH) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return fallback;
    }

    return value;
}

/** @deprecated Use getPasswordResetCallbackUrl from auth-recovery */
export function buildAuthCallbackRedirectUrl(origin: string, nextPath: string) {
    if (nextPath === PASSWORD_RESET_NEXT_PATH) {
        return getPasswordResetCallbackUrl(origin);
    }

    const base = getPasswordResetCallbackUrl(origin);
    return `${base}?next=${encodeURIComponent(nextPath)}`;
}
