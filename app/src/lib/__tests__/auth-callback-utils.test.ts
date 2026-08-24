import { describe, expect, it } from "vitest";
import { buildAuthCallbackRedirectUrl, getSafeAuthNextPath } from "@/lib/auth-callback-utils";

describe("auth-callback-utils", () => {
    it("allows same-origin relative paths", () => {
        expect(getSafeAuthNextPath("/auth/update-password")).toBe("/auth/update-password");
        expect(getSafeAuthNextPath("/")).toBe("/");
    });

    it("rejects open redirects", () => {
        expect(getSafeAuthNextPath("//evil.example")).toBe("/");
        expect(getSafeAuthNextPath("https://evil.example")).toBe("/");
        expect(getSafeAuthNextPath(null)).toBe("/");
    });

    it("builds api callback redirect urls", () => {
        expect(buildAuthCallbackRedirectUrl("http://localhost:3000", "/auth/update-password"))
            .toBe("http://localhost:3000/api/auth/callback/recovery");
        expect(buildAuthCallbackRedirectUrl("http://localhost:3000", "/dashboard"))
            .toBe("http://localhost:3000/api/auth/callback?next=%2Fdashboard");
    });
});
