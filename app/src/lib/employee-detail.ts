import type { EmployeeDetailTab } from "@/components/employees/employee-detail-client";

export function getEmployeeDetailSelect(tab: EmployeeDetailTab) {
    const relations: string[] = [];

    if (tab === "qualifications") {
        relations.push("employee_qualifications(*, qualification_master(*))");
    }

    if (tab === "family") {
        relations.push("employee_family(*)");
    }

    if (tab === "insurance") {
        relations.push("employee_life_insurances(*)");
        relations.push("employee_damage_insurances(*)");
    }

    return ["*", ...relations].join(",");
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
