import type { EmployeeDetailTab } from "@/components/employees/employee-detail-client";

// 他人を閲覧する一般アカウントに渡してよい「基本情報」カラム。
// 保険番号・年金番号・服薬情報・給与メモなどの機微カラムは含めない。
const SAFE_EMPLOYEE_COLUMNS = [
    "id", "employee_number", "name", "name_kana", "person_type",
    "partner_company", "partner_contact_name", "partner_notes",
    "branch", "job_title", "position", "employment_type",
    "hire_date", "termination_date", "birth_date", "gender",
    "phone_number", "email", "address", "blood_type", "photo_url",
    "experience_years", "experience_months", "experience_base_date",
    "created_at", "updated_at", "deleted_at",
].join(",");

export function getEmployeeDetailSelect(tab: EmployeeDetailTab, canViewSensitive: boolean = true) {
    // 全タブ横断で使う軽量データ（資格バッジ・家族手当判定・保険有無）。
    // 家族・保険は機微情報のため、閲覧権限がない場合は取得しない（タブを隠すだけでなく
    // データ自体をクライアントに渡さない）。
    const relations: string[] = [
        "employee_qualifications(id, employee_id, expiry_date, deleted_at, certificate_number, acquired_date, created_at, qualification_id)",
    ];

    if (canViewSensitive) {
        relations.push("employee_family(id, birth_date, is_dependent, relationship)");
        relations.push("employee_life_insurances(id)");
    }

    if (tab === "qualifications") {
        // 詳細表示用にフル取得（certificate_url, notes 等を含む）
        relations[0] = "employee_qualifications(*, qualification_master(*))";
    }

    if (tab === "family" && canViewSensitive) {
        relations[1] = "employee_family(*)";
    }

    if (tab === "insurance" && canViewSensitive) {
        relations[2] = "employee_life_insurances(*)";
        relations.push("employee_damage_insurances(*)");
    }

    // 機微情報を見られない閲覧者（他人を見る一般アカウント）には安全なカラムだけを渡す
    const baseColumns = canViewSensitive ? "*" : SAFE_EMPLOYEE_COLUMNS;
    return [baseColumns, ...relations].join(",");
}

export function shouldLoadEmployeeItAccounts(tab: EmployeeDetailTab, canAccessItAccounts: boolean) {
    return tab === "it" && canAccessItAccounts;
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
