import { describe, expect, it } from "vitest";
import {
    getHealthCheckResultLabel,
    getVehicleExpiryFilterLabel,
    getVehicleSortLabel,
} from "../display-labels";
import {
    getEmployeeDetailSelect,
    shouldLoadConstructionRecords,
    shouldLoadDeletedQualifications,
    shouldLoadEmployeePhoto,
    shouldLoadEmployeeItAccounts,
    shouldLoadExamHistory,
    shouldLoadHealthChecks,
    shouldLoadQualificationCertificateUrls,
    shouldLoadSeminarRecords,
} from "../employee-detail";

describe("display labels", () => {
    it("maps health check results to Japanese labels", () => {
        expect(getHealthCheckResultLabel(true)).toBe("異常なし");
        expect(getHealthCheckResultLabel(false)).toBe("要再検査");
        expect(getHealthCheckResultLabel(null)).toBe("-");
        expect(getHealthCheckResultLabel(undefined)).toBe("-");
    });

    it("maps vehicle sort and filter values without leaking internal values", () => {
        expect(getVehicleSortLabel("plate")).toBe("ナンバー順");
        expect(getVehicleSortLabel("inspection")).toBe("車検満了日順");
        expect(getVehicleExpiryFilterLabel("all")).toBe("すべて");
        expect(getVehicleExpiryFilterLabel("soon")).toBe("30日以内");
    });
});

describe("employee detail loading", () => {
    it("keeps base employee select eager for core profile tabs", () => {
        expect(getEmployeeDetailSelect("basic")).toContain("employee_qualifications");
        expect(getEmployeeDetailSelect("basic")).toContain("employee_family");
        expect(getEmployeeDetailSelect("basic")).toContain("employee_life_insurances");
        expect(shouldLoadConstructionRecords("basic")).toBe(false);
        expect(shouldLoadHealthChecks("basic")).toBe(false);
        expect(shouldLoadQualificationCertificateUrls("basic")).toBe(false);
        expect(shouldLoadDeletedQualifications("basic")).toBe(false);
        expect(shouldLoadExamHistory("basic")).toBe(false);
        expect(shouldLoadSeminarRecords("basic")).toBe(false);
        expect(shouldLoadEmployeePhoto("basic")).toBe(true);
    });

    it("loads qualification extras only for qualifications tab", () => {
        expect(getEmployeeDetailSelect("qualifications")).toContain("employee_qualifications");
        expect(shouldLoadQualificationCertificateUrls("qualifications")).toBe(true);
        expect(shouldLoadDeletedQualifications("qualifications")).toBe(true);
        expect(shouldLoadQualificationCertificateUrls("insurance")).toBe(false);
        expect(shouldLoadEmployeePhoto("qualifications")).toBe(false);
    });

    it("loads IT accounts only when on IT tab and role allows it", () => {
        expect(shouldLoadEmployeeItAccounts("it", true)).toBe(true);
        expect(shouldLoadEmployeeItAccounts("it", false)).toBe(false);
        expect(shouldLoadEmployeeItAccounts("basic", true)).toBe(false);
    });

    it("loads seminar data only for seminars tab", () => {
        expect(shouldLoadExamHistory("seminars")).toBe(true);
        expect(shouldLoadSeminarRecords("seminars")).toBe(true);
        expect(shouldLoadExamHistory("health")).toBe(false);
        expect(shouldLoadSeminarRecords("health")).toBe(false);
    });
});
