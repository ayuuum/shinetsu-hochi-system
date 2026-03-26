import { describe, it, expect } from "vitest";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMPLOYEE_NUMBER_REGEX = /^[A-Za-z0-9-]+$/;

function isValidDate(dateStr: string): boolean {
    if (!DATE_REGEX.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

function isValidEmployeeNumber(num: string): boolean {
    return EMPLOYEE_NUMBER_REGEX.test(num) && num.length >= 1 && num.length <= 20;
}

describe("Date Validation", () => {
    it("accepts valid date format YYYY-MM-DD", () => {
        expect(isValidDate("2025-01-15")).toBe(true);
    });

    it("rejects invalid date format", () => {
        expect(isValidDate("2025/01/15")).toBe(false);
        expect(isValidDate("15-01-2025")).toBe(false);
        expect(isValidDate("2025-1-5")).toBe(false);
    });

    it("rejects empty string", () => {
        expect(isValidDate("")).toBe(false);
    });

    it("rejects invalid date values", () => {
        expect(isValidDate("2025-13-01")).toBe(false);
        expect(isValidDate("2025-00-01")).toBe(false);
    });

    it("accepts leap year date", () => {
        expect(isValidDate("2024-02-29")).toBe(true);
    });
});

describe("Employee Number Validation", () => {
    it("accepts valid employee numbers", () => {
        expect(isValidEmployeeNumber("SH-001")).toBe(true);
        expect(isValidEmployeeNumber("E001")).toBe(true);
        expect(isValidEmployeeNumber("123")).toBe(true);
    });

    it("rejects empty string", () => {
        expect(isValidEmployeeNumber("")).toBe(false);
    });

    it("rejects special characters", () => {
        expect(isValidEmployeeNumber("SH 001")).toBe(false);
        expect(isValidEmployeeNumber("SH@001")).toBe(false);
    });

    it("rejects Japanese characters", () => {
        expect(isValidEmployeeNumber("社員001")).toBe(false);
    });

    it("accepts alphanumeric with hyphens", () => {
        expect(isValidEmployeeNumber("A-1-B-2")).toBe(true);
    });
});
