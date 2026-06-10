import type { EmployeeDetailTab } from "@/components/employees/employee-detail-client";

export function getEmployeeDetailSelect(tab: EmployeeDetailTab) {
    // Always include lightweight versions for cross-tab UI:
    // - urgency badge and license group detection (employee_qualifications)
    // - family allowance indicator (employee_family)
    // - insurance presence indicator (employee_life_insurances)
    const relations: string[] = [
        "employee_qualifications(id, employee_id, expiry_date, deleted_at, certificate_number, acquired_date, created_at, qualification_id)",
        "employee_family(id, birth_date, is_dependent, allowance_eligible, relationship)",
        "employee_life_insurances(id)",
    ];

    if (tab === "qualifications") {
        // Override to full detail (includes certificate_url, notes, etc.)
        relations[0] = "employee_qualifications(*, qualification_master(*))";
    }

    if (tab === "family") {
        relations[1] = "employee_family(*)";
    }

    if (tab === "insurance") {
        relations[2] = "employee_life_insurances(*)";
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
