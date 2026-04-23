import { describe, expect, it } from "vitest";
import {
    getHealthCheckResultLabel,
    getVehicleExpiryFilterLabel,
    getVehicleSortLabel,
} from "../display-labels";
import {
    getEmployeeDetailSelect,
    shouldLoadConstructionRecords,
    shouldLoadEmployeeItAccounts,
    shouldLoadHealthChecks,
    shouldLoadQualificationCertificateUrls,
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
    it("keeps basic tab on base employee select only", () => {
        expect(getEmployeeDetailSelect("basic")).toBe("*");
        expect(shouldLoadConstructionRecords("basic")).toBe(false);
        expect(shouldLoadHealthChecks("basic")).toBe(false);
        expect(shouldLoadQualificationCertificateUrls("basic")).toBe(false);
    });

    it("loads qualification extras only for qualifications tab", () => {
        expect(getEmployeeDetailSelect("qualifications")).toContain("employee_qualifications");
        expect(shouldLoadQualificationCertificateUrls("qualifications")).toBe(true);
        expect(shouldLoadQualificationCertificateUrls("insurance")).toBe(false);
    });

    it("loads IT accounts only when on IT tab and role allows it", () => {
        expect(shouldLoadEmployeeItAccounts("it", true)).toBe(true);
        expect(shouldLoadEmployeeItAccounts("it", false)).toBe(false);
        expect(shouldLoadEmployeeItAccounts("basic", true)).toBe(false);
    });
});
