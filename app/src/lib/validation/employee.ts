import * as z from "zod";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string) {
    if (!DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const requiredText = (label: string) => z.string().trim().min(1, `${label}は必須です`);
const optionalText = z.string().trim().optional();
const requiredDate = (label: string) =>
    z.string().trim().min(1, `${label}は必須です`).refine(isValidDateString, `${label}の形式が不正です`);
const optionalDate = (label: string) =>
    z.string().trim().optional().refine((value) => !value || isValidDateString(value), `${label}の形式が不正です`);
const optionalEmail = z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, "メールアドレスの形式が不正です");

const employeeBaseSchema = z.object({
    employee_number: requiredText("社員番号"),
    name: requiredText("氏名"),
    name_kana: requiredText("フリガナ"),
    birth_date: requiredDate("生年月日"),
    gender: optionalText,
    phone_number: optionalText,
    email: optionalEmail,
    address: optionalText,
    branch: optionalText,
    employment_type: optionalText,
    job_title: optionalText,
    position: optionalText,
    emp_insurance_no: optionalText,
    health_insurance_no: optionalText,
    pension_no: optionalText,
    photo_url: optionalText,
});

export const employeeCreateSchema = employeeBaseSchema.extend({
    branch: requiredText("拠点"),
    hire_date: requiredDate("入社日"),
});

export const employeeUpdateSchema = employeeBaseSchema.extend({
    hire_date: optionalDate("入社日"),
    termination_date: optionalDate("退職日"),
}).superRefine((values, ctx) => {
    if (values.hire_date && values.termination_date && values.termination_date < values.hire_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["termination_date"],
            message: "退職日は入社日以降を指定してください",
        });
    }
});

export type EmployeeCreateValues = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateValues = z.infer<typeof employeeUpdateSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function normalizeRequiredText(value: string) {
    return value.trim();
}

export function toEmployeeInsert(values: EmployeeCreateValues): TablesInsert<"employees"> {
    return {
        employee_number: normalizeRequiredText(values.employee_number),
        name: normalizeRequiredText(values.name),
        name_kana: normalizeRequiredText(values.name_kana),
        birth_date: values.birth_date,
        gender: normalizeNullableText(values.gender),
        phone_number: normalizeNullableText(values.phone_number),
        email: normalizeNullableText(values.email),
        address: normalizeNullableText(values.address),
        hire_date: values.hire_date,
        branch: normalizeNullableText(values.branch),
        employment_type: normalizeNullableText(values.employment_type),
        job_title: normalizeNullableText(values.job_title),
        position: normalizeNullableText(values.position),
        emp_insurance_no: normalizeNullableText(values.emp_insurance_no),
        health_insurance_no: normalizeNullableText(values.health_insurance_no),
        pension_no: normalizeNullableText(values.pension_no),
        photo_url: normalizeNullableText(values.photo_url),
    };
}

export function toEmployeeUpdate(values: EmployeeUpdateValues): TablesUpdate<"employees"> {
    return {
        employee_number: normalizeRequiredText(values.employee_number),
        name: normalizeRequiredText(values.name),
        name_kana: normalizeRequiredText(values.name_kana),
        birth_date: values.birth_date,
        gender: normalizeNullableText(values.gender),
        phone_number: normalizeNullableText(values.phone_number),
        email: normalizeNullableText(values.email),
        address: normalizeNullableText(values.address),
        hire_date: values.hire_date || null,
        termination_date: values.termination_date || null,
        branch: normalizeNullableText(values.branch),
        employment_type: normalizeNullableText(values.employment_type),
        job_title: normalizeNullableText(values.job_title),
        position: normalizeNullableText(values.position),
        emp_insurance_no: normalizeNullableText(values.emp_insurance_no),
        health_insurance_no: normalizeNullableText(values.health_insurance_no),
        pension_no: normalizeNullableText(values.pension_no),
        photo_url: normalizeNullableText(values.photo_url),
    };
}

export function toEmployeeUpdateFormValues(employee: Tables<"employees">): EmployeeUpdateValues {
    return {
        employee_number: employee.employee_number,
        name: employee.name,
        name_kana: employee.name_kana,
        birth_date: employee.birth_date || "",
        gender: employee.gender || "",
        phone_number: employee.phone_number || "",
        email: employee.email || "",
        address: employee.address || "",
        hire_date: employee.hire_date || "",
        termination_date: employee.termination_date || "",
        branch: employee.branch || "",
        employment_type: employee.employment_type || "",
        job_title: employee.job_title || "",
        position: employee.position || "",
        emp_insurance_no: employee.emp_insurance_no || "",
        health_insurance_no: employee.health_insurance_no || "",
        pension_no: employee.pension_no || "",
        photo_url: employee.photo_url || "",
    };
}
