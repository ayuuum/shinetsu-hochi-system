import { describe, expect, it } from "vitest";
import { formatDateInTokyo } from "../date";

describe("formatDateInTokyo", () => {
    it("uses Tokyo time when the UTC date crosses into the next day in JST", () => {
        expect(formatDateInTokyo("2026-03-31T16:00:00.000Z")).toBe("2026-04-01");
    });

    it("keeps the same calendar day when it is still the previous day in JST", () => {
        expect(formatDateInTokyo("2026-03-31T14:59:59.000Z")).toBe("2026-03-31");
    });
});
