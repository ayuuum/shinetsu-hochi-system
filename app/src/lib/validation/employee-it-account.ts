import { z } from "zod";

export const employeeItAccountSchema = z.object({
    employee_id: z.string().uuid("社員IDが不正です"),
    service_name: z
        .string()
        .trim()
        .min(1, "サービス名を入力してください")
        .max(200, "サービス名は200文字以内です"),
    login_id: z.string().trim().max(500, "ログインIDは500文字以内です").optional(),
    notes: z.string().max(5000, "メモは5000文字以内です").optional(),
    sort_order: z.number().int().min(0).max(9999),
});

export type EmployeeItAccountValues = z.infer<typeof employeeItAccountSchema>;

export function toItAccountInsert(values: EmployeeItAccountValues) {
    return {
        employee_id: values.employee_id,
        service_name: values.service_name.trim(),
        login_id: values.login_id?.trim() ? values.login_id.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
        sort_order: values.sort_order ?? 0,
    };
}

export function toItAccountUpdate(values: EmployeeItAccountValues) {
    return {
        ...toItAccountInsert(values),
        updated_at: new Date().toISOString(),
    };
}
