import * as z from "zod";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const checkTypeSchema = z.enum(["定期健康診断", "雇入時健康診断", "特殊健康診断"], {
    message: "種別を選択してください",
});

function isValidDateString(value: string) {
    if (!DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalText = z.string().trim().optional();
const optionalDecimal = (label: string) =>
    z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), `${label}の形式が不正です`);

export const healthCheckSchema = z.object({
    employee_id: z.string().uuid("対象社員を選択してください"),
    check_date: z
        .string()
        .trim()
        .min(1, "受診日は必須です")
        .refine(isValidDateString, "受診日の形式が不正です"),
    check_type: checkTypeSchema,
    hospital_name: optionalText,
    is_normal: z.enum(["true", "false"], {
        message: "結果を選択してください",
    }),
    height: optionalDecimal("身長"),
    weight: optionalDecimal("体重"),
    notes: optionalText,
});

export type HealthCheckValues = z.infer<typeof healthCheckSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function normalizeNullableNumber(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? Number(normalized) : null;
}

export function toHealthCheckInsert(values: HealthCheckValues): TablesInsert<"health_checks"> {
    return {
        employee_id: values.employee_id,
        check_date: values.check_date,
        check_type: values.check_type,
        hospital_name: normalizeNullableText(values.hospital_name),
        is_normal: values.is_normal === "true",
        height: normalizeNullableNumber(values.height),
        weight: normalizeNullableNumber(values.weight),
        notes: normalizeNullableText(values.notes),
    };
}

export function toHealthCheckUpdate(values: HealthCheckValues): TablesUpdate<"health_checks"> {
    return {
        employee_id: values.employee_id,
        check_date: values.check_date,
        check_type: values.check_type,
        hospital_name: normalizeNullableText(values.hospital_name),
        is_normal: values.is_normal === "true",
        height: normalizeNullableNumber(values.height),
        weight: normalizeNullableNumber(values.weight),
        notes: normalizeNullableText(values.notes),
    };
}

export function toHealthCheckFormValues(record: Tables<"health_checks">): HealthCheckValues {
    return {
        employee_id: record.employee_id || "",
        check_date: record.check_date,
        check_type: (record.check_type as HealthCheckValues["check_type"]) || "定期健康診断",
        hospital_name: record.hospital_name || "",
        is_normal: record.is_normal === false ? "false" : "true",
        height: record.height != null ? String(record.height) : "",
        weight: record.weight != null ? String(record.weight) : "",
        notes: record.notes || "",
    };
}
