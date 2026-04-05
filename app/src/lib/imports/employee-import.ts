import { employeeCreateSchema, type EmployeeCreateValues } from "@/lib/validation/employee";

export type EmployeeImportSourceRow = Record<string, string>;

export type EmployeeImportPreviewRow = {
    row: number;
    employeeNumber: string;
    name: string;
    valid: boolean;
    errors: string[];
    values: EmployeeCreateValues | null;
};

export function normalizeEmployeeImportDate(value?: string) {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
        return "";
    }

    const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!match) {
        return trimmed;
    }

    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeText(value?: string) {
    return value?.trim() ?? "";
}

export function buildEmployeeImportValues(row: EmployeeImportSourceRow): EmployeeCreateValues {
    return {
        employee_number: normalizeText(row.employee_number),
        name: normalizeText(row.name),
        name_kana: normalizeText(row.name_kana),
        birth_date: normalizeEmployeeImportDate(row.birth_date),
        gender: normalizeText(row.gender),
        phone_number: normalizeText(row.phone_number),
        email: normalizeText(row.email),
        address: normalizeText(row.address),
        hire_date: normalizeEmployeeImportDate(row.hire_date),
        branch: normalizeText(row.branch),
        employment_type: normalizeText(row.employment_type),
        job_title: normalizeText(row.job_title),
        position: normalizeText(row.position),
        emp_insurance_no: normalizeText(row.emp_insurance_no),
        health_insurance_no: normalizeText(row.health_insurance_no),
        pension_no: normalizeText(row.pension_no),
    };
}

export function validateEmployeeImportValues(values: EmployeeCreateValues) {
    return employeeCreateSchema.safeParse(values);
}
