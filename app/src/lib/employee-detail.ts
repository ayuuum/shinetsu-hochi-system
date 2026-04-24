import type { EmployeeDetailTab } from "@/components/employees/employee-detail-client";

export function getEmployeeDetailSelect(tab: EmployeeDetailTab) {
    void tab;
    return `
        *,
        employee_qualifications(*, qualification_master(*)),
        employee_family(*),
        employee_life_insurances(*),
        employee_damage_insurances(*)
    `;
}

export function shouldLoadEmployeeItAccounts(tab: EmployeeDetailTab, canManageItAccounts: boolean) {
    return tab === "it" && canManageItAccounts;
}

export function shouldLoadConstructionRecords(tab: EmployeeDetailTab) {
    return tab === "construction";
}

export function shouldLoadHealthChecks(tab: EmployeeDetailTab) {
    return tab === "health";
}

export function shouldLoadQualificationCertificateUrls(tab: EmployeeDetailTab) {
    return tab === "qualifications";
}

export function shouldLoadDeletedQualifications(tab: EmployeeDetailTab) {
    return tab === "qualifications";
}

export function shouldLoadExamHistory(tab: EmployeeDetailTab) {
    return tab === "seminars";
}

export function shouldLoadSeminarRecords(tab: EmployeeDetailTab) {
    return tab === "seminars";
}

export function shouldLoadEmployeePhoto(tab: EmployeeDetailTab) {
    return tab === "basic";
}
