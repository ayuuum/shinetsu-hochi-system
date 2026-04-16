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

const optionalDate = (label: string) =>
    z.string().trim().optional().refine((value) => !value || isValidDateString(value), `${label}の形式が不正です`);

const optionalAmountString = z
    .string()
    .trim()
    .optional()
    .refine((value) => {
        if (!value) return true;
        const n = Number(value.replace(/,/g, ""));
        return Number.isFinite(n) && n >= 0;
    }, "金額は0以上の数値を入力してください");

export const equipmentSchema = z.object({
    management_number: z.string().trim().min(1, "管理番号は必須です"),
    name: z.string().trim().min(1, "品名は必須です"),
    category: z.string().trim().optional(),
    purchase_date: optionalDate("購入日"),
    purchase_amount: optionalAmountString,
    branch: z.string().trim().optional(),
    notes: z.string().trim().optional(),
});

export type EquipmentValues = z.infer<typeof equipmentSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function parsePurchaseAmount(value: string | undefined) {
    const v = value?.trim();
    if (!v) return null;
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
}

export function toEquipmentInsert(values: EquipmentValues): TablesInsert<"equipment_items"> {
    return {
        management_number: values.management_number.trim(),
        name: values.name.trim(),
        category: normalizeNullableText(values.category),
        purchase_date: values.purchase_date || null,
        purchase_amount: parsePurchaseAmount(values.purchase_amount),
        branch: normalizeNullableText(values.branch),
        notes: normalizeNullableText(values.notes),
    };
}

export function toEquipmentUpdate(values: EquipmentValues): TablesUpdate<"equipment_items"> {
    return toEquipmentInsert(values);
}

export function toEquipmentFormValues(row: Tables<"equipment_items">): EquipmentValues {
    return {
        management_number: row.management_number,
        name: row.name,
        category: row.category ?? "",
        purchase_date: row.purchase_date ?? "",
        purchase_amount: row.purchase_amount != null ? String(row.purchase_amount) : "",
        branch: row.branch ?? "",
        notes: row.notes ?? "",
    };
}
