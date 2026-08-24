export const AUTH_RECOVERY_COOKIE = "sb-auth-recovery";
export const PASSWORD_RESET_NEXT_PATH = "/auth/update-password";

export function getPasswordResetCallbackUrl(origin: string) {
    return `${origin.replace(/\/$/, "")}/api/auth/callback`;
}
