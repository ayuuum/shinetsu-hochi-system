import { describe, expect, it } from "vitest";
import { getCalendarMonthRange } from "@/components/shared/date-picker-field";

describe("getCalendarMonthRange", () => {
    it("allows selecting up to 10 years in the future", () => {
        const currentYear = new Date().getFullYear();
        const { endMonth } = getCalendarMonthRange(undefined, 100, 10);

        expect(endMonth.getFullYear()).toBe(currentYear + 10);
        expect(endMonth.getMonth()).toBe(11);
    });

    it("allows selecting up to 100 years in the past", () => {
        const currentYear = new Date().getFullYear();
        const { startMonth } = getCalendarMonthRange(undefined, 100, 10);

        expect(startMonth.getFullYear()).toBe(currentYear - 100);
        expect(startMonth.getMonth()).toBe(0);
    });

    it("expands range when an existing value is outside the default window", () => {
        const farFuture = new Date(2040, 5, 15);
        const { endMonth } = getCalendarMonthRange(farFuture, 100, 10);

        expect(endMonth.getFullYear()).toBe(2040);
    });
});
