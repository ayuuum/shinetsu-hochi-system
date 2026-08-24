import { describe, expect, it } from "vitest";
import { getSafeAuthNextPath, buildAuthCallbackRedirectUrl } from "@/lib/auth-callback-utils";
import { PASSWORD_RESET_NEXT_PATH } from "@/lib/auth-recovery";

describe("auth-callback-utils", () => {
    it("allows same-origin relative paths", () => {
        expect(getSafeAuthNextPath("/auth/update-password")).toBe("/auth/update-password");
        expect(getSafeAuthNextPath("/")).toBe("/");
    });

    it("rejects open redirects and falls back to password reset path", () => {
        expect(getSafeAuthNextPath("//evil.example")).toBe(PASSWORD_RESET_NEXT_PATH);
        expect(getSafeAuthNextPath("https://evil.example")).toBe(PASSWORD_RESET_NEXT_PATH);
        expect(getSafeAuthNextPath(null)).toBe(PASSWORD_RESET_NEXT_PATH);
    });

    it("builds api callback redirect urls", () => {
        expect(buildAuthCallbackRedirectUrl("http://localhost:3000", PASSWORD_RESET_NEXT_PATH))
            .toBe("http://localhost:3000/api/auth/callback");
        expect(buildAuthCallbackRedirectUrl("http://localhost:3000", "/dashboard"))
            .toBe("http://localhost:3000/api/auth/callback?next=%2Fdashboard");
    });
});
