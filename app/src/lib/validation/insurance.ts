import { z } from "zod";

export const lifeInsuranceSchema = z.object({
    employee_id: z.string().uuid("対象社員を選択してください。"),
    insurance_name: z.string().min(1, "保険名を入力してください。").max(100, "保険名は100文字以内で入力してください。"),
    insurance_company: z.string().min(1, "保険会社を入力してください。").max(100, "保険会社は100文字以内で入力してください。"),
    agency: z.string().max(100, "代理店は100文字以内で入力してください。").optional().nullable(),
    start_date: z.string().min(1, "加入日を入力してください。"),
    maturity_date: z.string().min(1, "満期日を入力してください。"),
    peak_date: z.string().optional().nullable(),
    payout_ratio: z.string().optional().nullable().refine((val) => {
        if (!val) return true;
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 999.99;
    }, "返戻率は0〜999.99の間で入力してください。"),
    notes: z.string().max(1000, "備考は1000文字以内で入力してください。").optional().nullable(),
});

export type LifeInsuranceValues = z.infer<typeof lifeInsuranceSchema>;

export function toLifeInsuranceInsert(values: LifeInsuranceValues) {
    return {
        employee_id: values.employee_id,
        insurance_name: values.insurance_name,
        insurance_company: values.insurance_company,
        agency: values.agency || null,
        start_date: values.start_date,
        maturity_date: values.maturity_date,
        peak_date: values.peak_date || null,
        payout_ratio: values.payout_ratio ? parseFloat(values.payout_ratio) : null,
        notes: values.notes || null,
    };
}

export function toLifeInsuranceUpdate(values: LifeInsuranceValues) {
    return toLifeInsuranceInsert(values);
}

export const damageInsuranceSchema = z.object({
    employee_id: z.string().uuid("対象社員を選択してください。"),
    insurance_type: z.string().min(1, "保険種類を選択してください。"),
    insurance_name: z.string().min(1, "保険名を入力してください。").max(100, "保険名は100文字以内で入力してください。"),
    insurance_company: z.string().min(1, "保険会社を入力してください。").max(100, "保険会社は100文字以内で入力してください。"),
    agency: z.string().max(100, "代理店は100文字以内で入力してください。").optional().nullable(),
    renewal_date: z.string().min(1, "更改日（更新日）を入力してください。"),
    coverage_details: z.string().max(1000, "条件・補償内容は1000文字以内で入力してください。").optional().nullable(),
    notes: z.string().max(1000, "備考は1000文字以内で入力してください。").optional().nullable(),
});

export type DamageInsuranceValues = z.infer<typeof damageInsuranceSchema>;

export function toDamageInsuranceInsert(values: DamageInsuranceValues) {
    return {
        employee_id: values.employee_id,
        insurance_type: values.insurance_type,
        insurance_name: values.insurance_name,
        insurance_company: values.insurance_company,
        agency: values.agency || null,
        renewal_date: values.renewal_date,
        coverage_details: values.coverage_details || null,
        notes: values.notes || null,
    };
}

export function toDamageInsuranceUpdate(values: DamageInsuranceValues) {
    return toDamageInsuranceInsert(values);
}
