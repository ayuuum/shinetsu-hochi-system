import { describe, expect, it } from "vitest";
import { toFormBirthDate } from "@/lib/validation/employee";

describe("toFormBirthDate", () => {
    it("treats the partner placeholder date as empty", () => {
        expect(toFormBirthDate("1900-01-01")).toBe("");
    });

    it("keeps a real birth date", () => {
        expect(toFormBirthDate("1990-04-01")).toBe("1990-04-01");
    });

    it("treats missing values as empty", () => {
        expect(toFormBirthDate(null)).toBe("");
        expect(toFormBirthDate(undefined)).toBe("");
        expect(toFormBirthDate("")).toBe("");
    });
});
