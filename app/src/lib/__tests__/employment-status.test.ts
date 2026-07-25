import { describe, expect, it } from "vitest";
import {
    getEmploymentStatusLabel,
    parseEmploymentStatus,
} from "@/lib/employment-status";

describe("employment-status", () => {
    it("defaults to active when value is missing or unknown", () => {
        expect(parseEmploymentStatus(undefined)).toBe("active");
        expect(parseEmploymentStatus(null)).toBe("active");
        expect(parseEmploymentStatus("foo")).toBe("active");
    });

    it("parses retired and all", () => {
        expect(parseEmploymentStatus("retired")).toBe("retired");
        expect(parseEmploymentStatus("all")).toBe("all");
    });

    it("returns Japanese labels", () => {
        expect(getEmploymentStatusLabel("active")).toBe("在職");
        expect(getEmploymentStatusLabel("retired")).toBe("退職");
        expect(getEmploymentStatusLabel("all")).toBe("すべて");
    });
});
