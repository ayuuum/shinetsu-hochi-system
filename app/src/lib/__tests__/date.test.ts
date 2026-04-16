import { describe, expect, it } from "vitest";
import { formatDateInTokyo, getTokyoCalendarMonthBounds, isYmdInInclusiveRange } from "../date";

describe("formatDateInTokyo", () => {
    it("uses Tokyo time when the UTC date crosses into the next day in JST", () => {
        expect(formatDateInTokyo("2026-03-31T16:00:00.000Z")).toBe("2026-04-01");
    });

    it("keeps the same calendar day when it is still the previous day in JST", () => {
        expect(formatDateInTokyo("2026-03-31T14:59:59.000Z")).toBe("2026-03-31");
    });
});

describe("getTokyoCalendarMonthBounds", () => {
    it("returns first and last day for April", () => {
        expect(getTokyoCalendarMonthBounds("2026-04-10")).toEqual({
            start: "2026-04-01",
            end: "2026-04-30",
        });
    });

    it("handles February in a leap year", () => {
        expect(getTokyoCalendarMonthBounds("2024-02-15")).toEqual({
            start: "2024-02-01",
            end: "2024-02-29",
        });
    });
});

describe("isYmdInInclusiveRange", () => {
    it("returns false for empty values", () => {
        expect(isYmdInInclusiveRange(null, "2026-04-01", "2026-04-30")).toBe(false);
        expect(isYmdInInclusiveRange(undefined, "2026-04-01", "2026-04-30")).toBe(false);
    });

    it("includes boundaries", () => {
        expect(isYmdInInclusiveRange("2026-04-01", "2026-04-01", "2026-04-30")).toBe(true);
        expect(isYmdInInclusiveRange("2026-04-30", "2026-04-01", "2026-04-30")).toBe(true);
        expect(isYmdInInclusiveRange("2026-03-31", "2026-04-01", "2026-04-30")).toBe(false);
    });
});
