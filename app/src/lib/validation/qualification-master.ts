import { z } from "zod";

export const qualificationMasterCreateSchema = z.object({
    name: z.string().trim().min(1, "資格名を入力してください。").max(200),
    category: z.string().trim().max(100),
    renewal_rule: z.string().trim().max(2000),
    has_expiry: z.boolean(),
});

export const qualificationMasterUpdateSchema = qualificationMasterCreateSchema.extend({
    id: z.string().uuid(),
});

export type QualificationMasterCreateValues = z.infer<typeof qualificationMasterCreateSchema>;
export type QualificationMasterUpdateValues = z.infer<typeof qualificationMasterUpdateSchema>;

export function toQualificationMasterDbFields(values: QualificationMasterCreateValues) {
    return {
        name: values.name,
        category: values.category.trim() ? values.category.trim() : null,
        renewal_rule: values.renewal_rule.trim() ? values.renewal_rule.trim() : null,
        has_expiry: values.has_expiry,
    };
}
