export type QualificationImportSourceRow = Record<string, string>;

export type QualificationImportPreviewRow = {
    row: number;
    employeeNumber: string;
    employeeName: string;
    qualificationName: string;
    acquiredDate: string;
    expiryDate: string;
    valid: boolean;
    errors: string[];
    values: {
        employee_number: string;
        qualification_name: string;
        acquired_date: string;
        expiry_date: string;
        status: string;
        issuing_authority: string;
        certificate_number: string;
    } | null;
};

const COLUMN_MAP: Record<string, string> = {
    "社員番号": "employee_number",
    "氏名": "employee_name",
    "資格名": "qualification_name",
    "取得日": "acquired_date",
    "有効期限": "expiry_date",
    "申込状況": "status",
    "交付機関": "issuing_authority",
    "免状番号": "certificate_number",
    "employee_number": "employee_number",
    "employee_name": "employee_name",
    "qualification_name": "qualification_name",
    "acquired_date": "acquired_date",
    "expiry_date": "expiry_date",
    "status": "status",
    "issuing_authority": "issuing_authority",
    "certificate_number": "certificate_number",
};

export const QUALIFICATION_IMPORT_TEMPLATE_HEADERS = [
    "社員番号",
    "資格名",
    "取得日",
    "有効期限",
    "申込状況",
    "交付機関",
    "免状番号",
];

export const QUALIFICATION_IMPORT_TEMPLATE_SAMPLE_ROW = [
    "SH-001",
    "消防設備士甲種1類",
    "2022-04-01",
    "2027-03-31",
    "取得済み",
    "消防試験研究センター",
    "第12345号",
];

export const QUALIFICATION_IMPORT_COLUMN_MAP = COLUMN_MAP;

function normalizeDate(value?: string): string {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return "";
    const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (!match) return trimmed;
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeText(value?: string): string {
    return value?.trim() ?? "";
}

export function buildQualificationImportValues(row: QualificationImportSourceRow) {
    return {
        employee_number: normalizeText(row.employee_number),
        qualification_name: normalizeText(row.qualification_name),
        acquired_date: normalizeDate(row.acquired_date),
        expiry_date: normalizeDate(row.expiry_date),
        status: normalizeText(row.status) || "取得済み",
        issuing_authority: normalizeText(row.issuing_authority),
        certificate_number: normalizeText(row.certificate_number),
    };
}

export function validateQualificationImportValues(values: ReturnType<typeof buildQualificationImportValues>): string[] {
    const errors: string[] = [];
    if (!values.employee_number) errors.push("社員番号は必須です");
    if (!values.qualification_name) errors.push("資格名は必須です");
    if (values.acquired_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.acquired_date)) {
        errors.push("取得日の形式が正しくありません（YYYY-MM-DD）");
    }
    if (values.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(values.expiry_date)) {
        errors.push("有効期限の形式が正しくありません（YYYY-MM-DD）");
    }
    return errors;
}
