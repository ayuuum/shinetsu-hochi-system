import type { EmployeeDetailTab } from "@/components/employees/employee-detail-client";

export function getEmployeeDetailSelect(tab: EmployeeDetailTab) {
    if (tab === "qualifications") {
        return "*, employee_qualifications(*, qualification_master(*))";
    }
    if (tab === "family") {
        return "*, employee_family(*)";
    }
    if (tab === "insurance") {
        return "*, employee_life_insurances(*), employee_damage_insurances(*)";
    }
    return "*";
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
