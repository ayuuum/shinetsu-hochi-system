import * as z from "zod";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const EQUIPMENT_OPTIONS = ["消防", "セキュリティ", "通信", "複合"] as const;
export const WORK_TYPE_OPTIONS = ["新設", "更新", "増設", "修繕", "点検"] as const;

// Retaining legacy category for backward compatibility if needed, or mapping to it.
const categorySchema = z.enum(["消防設備工事", "電気設備工事", "空調設備工事", "その他"], {
    message: "カテゴリを選択してください",
});

function isValidDateString(value: string) {
    if (!DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalText = z.string().trim().optional();
const optionalDecimal = z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Number(value)), "金額の形式が不正です");

export const projectSchema = z.object({
    construction_name: z.string().trim().min(1, "工事名は必須です"),
    client_name: z.string().trim().min(1, "発注者は必須です"),
    category: categorySchema, // Keeping this field as it was previously required by the DB
    equipment_types: z.array(z.enum(EQUIPMENT_OPTIONS)).min(1, "設備種別を1つ以上選択してください"),
    work_type: z.enum(WORK_TYPE_OPTIONS, { message: "施工内容を選択してください" }),
    contract_amount: optionalDecimal,
    construction_date: z
        .string()
        .trim()
        .min(1, "着工日は必須です")
        .refine(isValidDateString, "着工日の形式が不正です"),
    end_date: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || isValidDateString(val), "完工日の形式が不正です"),
    employee_id: z.string().uuid("担当者を選択してください"),
    role: optionalText,
    location: optionalText,
    notes: optionalText,
});

export type ProjectValues = z.infer<typeof projectSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function normalizeNullableNumber(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? Number(normalized) : null;
}

export function toProjectInsert(values: ProjectValues): TablesInsert<"construction_records"> {
    return {
        construction_name: values.construction_name.trim(),
        client_name: values.client_name.trim(),
        category: values.category,
        equipment_types: values.equipment_types,
        work_type: values.work_type,
        contract_amount: normalizeNullableNumber(values.contract_amount),
        construction_date: values.construction_date,
        end_date: normalizeNullableText(values.end_date),
        employee_id: values.employee_id,
        role: normalizeNullableText(values.role),
        location: normalizeNullableText(values.location),
        notes: normalizeNullableText(values.notes),
    };
}

export function toProjectUpdate(values: ProjectValues): TablesUpdate<"construction_records"> {
    return {
        construction_name: values.construction_name.trim(),
        client_name: values.client_name.trim(),
        category: values.category,
        equipment_types: values.equipment_types,
        work_type: values.work_type,
        contract_amount: normalizeNullableNumber(values.contract_amount),
        construction_date: values.construction_date,
        end_date: normalizeNullableText(values.end_date),
        employee_id: values.employee_id,
        role: normalizeNullableText(values.role),
        location: normalizeNullableText(values.location),
        notes: normalizeNullableText(values.notes),
    };
}

export function toProjectFormValues(record: Tables<"construction_records">): ProjectValues {
    return {
        construction_name: record.construction_name,
        client_name: record.client_name || "",
        category: (record.category as ProjectValues["category"]) || "消防設備工事",
        equipment_types: (record.equipment_types as typeof EQUIPMENT_OPTIONS[number][]) || [],
        work_type: (record.work_type as typeof WORK_TYPE_OPTIONS[number]) || "新設",
        contract_amount: record.contract_amount ? String(record.contract_amount) : "",
        construction_date: record.construction_date,
        end_date: record.end_date || "",
        employee_id: record.employee_id || "",
        role: record.role || "",
        location: record.location || "",
        notes: record.notes || "",
    };
}
