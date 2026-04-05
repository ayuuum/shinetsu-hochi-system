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

export const vehicleSchema = z.object({
    plate_number: z.string().trim().min(1, "ナンバーは必須です"),
    vehicle_name: z.string().trim().optional(),
    primary_user_id: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || z.string().uuid().safeParse(value).success, "主使用者が不正です"),
    inspection_expiry: optionalDate("車検満了日"),
    liability_insurance_expiry: optionalDate("自賠責保険満期日"),
    voluntary_insurance_expiry: optionalDate("任意保険満期日"),
});

export type VehicleValues = z.infer<typeof vehicleSchema>;

function normalizeNullableText(value?: string | null) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

export function toVehicleInsert(values: VehicleValues): TablesInsert<"vehicles"> {
    return {
        plate_number: values.plate_number.trim(),
        vehicle_name: normalizeNullableText(values.vehicle_name),
        primary_user_id: normalizeNullableText(values.primary_user_id),
        inspection_expiry: values.inspection_expiry || null,
        liability_insurance_expiry: values.liability_insurance_expiry || null,
        voluntary_insurance_expiry: values.voluntary_insurance_expiry || null,
    };
}

export function toVehicleUpdate(values: VehicleValues): TablesUpdate<"vehicles"> {
    return {
        plate_number: values.plate_number.trim(),
        vehicle_name: normalizeNullableText(values.vehicle_name),
        primary_user_id: normalizeNullableText(values.primary_user_id),
        inspection_expiry: values.inspection_expiry || null,
        liability_insurance_expiry: values.liability_insurance_expiry || null,
        voluntary_insurance_expiry: values.voluntary_insurance_expiry || null,
    };
}

export function toVehicleFormValues(vehicle: Tables<"vehicles">): VehicleValues {
    return {
        plate_number: vehicle.plate_number,
        vehicle_name: vehicle.vehicle_name || "",
        primary_user_id: vehicle.primary_user_id || "",
        inspection_expiry: vehicle.inspection_expiry || "",
        liability_insurance_expiry: vehicle.liability_insurance_expiry || "",
        voluntary_insurance_expiry: vehicle.voluntary_insurance_expiry || "",
    };
}
