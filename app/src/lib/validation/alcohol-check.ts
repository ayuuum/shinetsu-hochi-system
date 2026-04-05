import * as z from "zod";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isValidDatetimeLocal(value: string) {
    if (!DATETIME_LOCAL_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

const optionalText = z.string().trim().optional();
const optionalDecimal = z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "検知器の値の形式が不正です");

export const alcoholCheckSchema = z.object({
    employee_id: z.string().uuid("社員を選択してください"),
    check_type: z.enum(["出勤時", "退勤時"], {
        message: "検査種別を選択してください",
    }),
    check_datetime: z
        .string()
        .trim()
        .min(1, "検査日時は必須です")
        .refine(isValidDatetimeLocal, "検査日時の形式が不正です"),
    checker_id: z.string().uuid("確認者を選択してください"),
    measured_value: optionalDecimal,
    is_abnormal: z.enum(["適正", "不適正"], {
        message: "判定結果を選択してください",
    }),
    location: optionalText,
    notes: optionalText,
});

export type AlcoholCheckValues = z.infer<typeof alcoholCheckSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function normalizeNullableNumber(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? Number(normalized) : null;
}

export function toAlcoholCheckInsert(values: AlcoholCheckValues): TablesInsert<"alcohol_checks"> {
    return {
        employee_id: values.employee_id,
        check_type: values.check_type,
        check_datetime: values.check_datetime,
        checker_id: values.checker_id,
        measured_value: normalizeNullableNumber(values.measured_value),
        is_abnormal: values.is_abnormal === "不適正",
        location: normalizeNullableText(values.location),
        notes: normalizeNullableText(values.notes),
    };
}

export function toAlcoholCheckUpdate(values: AlcoholCheckValues): TablesUpdate<"alcohol_checks"> {
    return {
        employee_id: values.employee_id,
        check_type: values.check_type,
        check_datetime: values.check_datetime,
        checker_id: values.checker_id,
        measured_value: normalizeNullableNumber(values.measured_value),
        is_abnormal: values.is_abnormal === "不適正",
        location: normalizeNullableText(values.location),
        notes: normalizeNullableText(values.notes),
    };
}

export function toAlcoholCheckFormValues(record: Pick<Tables<"alcohol_checks">, "employee_id" | "check_type" | "check_datetime" | "checker_id" | "measured_value" | "is_abnormal" | "location" | "notes">): AlcoholCheckValues {
    return {
        employee_id: record.employee_id || "",
        check_type: (record.check_type as AlcoholCheckValues["check_type"]) || "出勤時",
        check_datetime: record.check_datetime?.slice(0, 16) || "",
        checker_id: record.checker_id || "",
        measured_value: record.measured_value != null ? String(record.measured_value) : "",
        is_abnormal: record.is_abnormal ? "不適正" : "適正",
        location: record.location || "",
        notes: record.notes || "",
    };
}
