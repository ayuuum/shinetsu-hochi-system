import * as z from "zod";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string) {
    if (!DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const requiredText = (label: string) => z.string().trim().min(1, `${label}は必須です`);
const optionalText = z.string().trim().optional();
const optionalDate = (label: string) =>
    z.string().trim().optional().refine((value) => !value || isValidDateString(value), `${label}の形式が不正です`);

export const employeeFamilySchema = z.object({
    employee_id: requiredText("対象社員"),
    name: requiredText("氏名"),
    relationship: optionalText,
    birth_date: optionalDate("生年月日"),
    is_dependent: z.boolean(),
    has_disability: z.boolean(),
    is_emergency_contact: z.boolean(),
    address: optionalText,
    phone_number: optionalText,
    blood_type: optionalText,
});

export type EmployeeFamilyValues = z.infer<typeof employeeFamilySchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

export function toEmployeeFamilyInsert(values: EmployeeFamilyValues): TablesInsert<"employee_family"> {
    return {
        employee_id: values.employee_id,
        name: values.name.trim(),
        relationship: normalizeNullableText(values.relationship),
        birth_date: values.birth_date || null,
        is_dependent: values.is_dependent,
        has_disability: values.has_disability,
        is_emergency_contact: values.is_emergency_contact,
        address: normalizeNullableText(values.address),
        phone_number: normalizeNullableText(values.phone_number),
        blood_type: normalizeNullableText(values.blood_type),
    };
}

export function toEmployeeFamilyUpdate(values: EmployeeFamilyValues): TablesUpdate<"employee_family"> {
    return toEmployeeFamilyInsert(values);
}

export function toEmployeeFamilyFormValues(row: Tables<"employee_family">): EmployeeFamilyValues {
    return {
        employee_id: row.employee_id || "",
        name: row.name,
        relationship: row.relationship || "",
        birth_date: row.birth_date || "",
        is_dependent: row.is_dependent || false,
        has_disability: row.has_disability || false,
        is_emergency_contact: row.is_emergency_contact || false,
        address: row.address || "",
        phone_number: row.phone_number || "",
        blood_type: row.blood_type || "",
    };
}
