"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthSnapshot } from "@/lib/auth-server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Json } from "@/types/supabase";
import {
    employeeCreateSchema,
    employeeUpdateSchema,
    toEmployeeInsert,
    toEmployeeUpdate,
    type EmployeeCreateValues,
    type EmployeeUpdateValues,
} from "@/lib/validation/employee";
import {
    vehicleSchema,
    toVehicleInsert,
    toVehicleUpdate,
    type VehicleValues,
} from "@/lib/validation/vehicle";
import {
    equipmentSchema,
    toEquipmentInsert,
    toEquipmentUpdate,
    type EquipmentValues,
} from "@/lib/validation/equipment";
import {
    projectSchema,
    toProjectInsert,
    toProjectUpdate,
    type ProjectValues,
} from "@/lib/validation/project";
import {
    healthCheckSchema,
    toHealthCheckInsert,
    toHealthCheckUpdate,
    type HealthCheckValues,
} from "@/lib/validation/health-check";
import {
    alcoholCheckSchema,
    toAlcoholCheckInsert,
    toAlcoholCheckUpdate,
    type AlcoholCheckValues,
} from "@/lib/validation/alcohol-check";
import {
    lifeInsuranceSchema,
    toLifeInsuranceInsert,
    toLifeInsuranceUpdate,
    type LifeInsuranceValues,
    damageInsuranceSchema,
    toDamageInsuranceInsert,
    toDamageInsuranceUpdate,
    type DamageInsuranceValues,
} from "@/lib/validation/insurance";
import {
    employeeItAccountSchema,
    toItAccountInsert,
    toItAccountUpdate,
    type EmployeeItAccountValues,
} from "@/lib/validation/employee-it-account";
import {
    employeeFamilySchema,
    toEmployeeFamilyInsert,
    toEmployeeFamilyUpdate,
    type EmployeeFamilyValues,
} from "@/lib/validation/employee-family";

type ActionResult<TField extends string> =
    | { success: true }
    | { success: false; error: string; fieldErrors?: Partial<Record<TField, string>> };

function getFieldErrors<TField extends string>(error: z.ZodError): Partial<Record<TField, string>> {
    const flattened = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const result: Partial<Record<TField, string>> = {};

    for (const [key, messages] of Object.entries(flattened)) {
        if (messages && messages[0]) {
            result[key as TField] = messages[0];
        }
    }

    return result;
}

async function requireAdminOrHr() {
    const { user, role } = await getAuthSnapshot();

    if (!user || (role !== "admin" && role !== "hr")) {
        return { ok: false as const, error: "この操作を実行する権限がありません。" };
    }

    return { ok: true as const, user };
}

async function recordAuditLog({
    actorId,
    actorEmail,
    entityType,
    entityId,
    action,
    summary,
    metadata,
}: {
    actorId: string;
    actorEmail: string | null;
    entityType: string;
    entityId: string;
    action: "create" | "update" | "delete";
    summary?: string;
    metadata?: Json;
}) {
    try {
        const supabase = await createSupabaseServer();
        const { error } = await supabase.from("audit_logs").insert([{
            actor_id: actorId,
            actor_email: actorEmail,
            entity_type: entityType,
            entity_id: entityId,
            action,
            summary: summary || null,
            metadata: metadata ?? null,
        }]);

        if (error) {
            console.error("Failed to write audit log:", error);
        }
    } catch (error) {
        console.error("Unexpected error while writing audit log:", error);
    }
}

function revalidateEmployeePaths(employeeId?: string) {
    revalidatePath("/");
    revalidatePath("/employees");
    revalidatePath("/qualifications");
    revalidatePath("/vehicles");
    revalidatePath("/projects");
    revalidatePath("/health-checks");
    revalidatePath("/alcohol-checks");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

function revalidateVehiclePaths() {
    revalidatePath("/");
    revalidatePath("/vehicles");
}

function revalidateProjectPaths(employeeId?: string | null) {
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/employees");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

function revalidateHealthCheckPaths(employeeId?: string | null) {
    revalidatePath("/health-checks");
    revalidatePath("/employees");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

function revalidateAlcoholCheckPaths(employeeId?: string | null) {
    revalidatePath("/");
    revalidatePath("/alcohol-checks");
    revalidatePath("/employees");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

function revalidateInsurancePaths(employeeId?: string | null) {
    revalidatePath("/insurances");
    revalidatePath("/employees");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

function revalidateFamilyPaths(employeeId?: string | null) {
    revalidatePath("/employees");
    if (employeeId) {
        revalidatePath(`/employees/${employeeId}`);
    }
}

async function employeeNumberTaken(employeeNumber: string, excludeId?: string) {
    const supabase = await createSupabaseServer();
    let query = supabase
        .from("employees")
        .select("id")
        .eq("employee_number", employeeNumber)
        .is("deleted_at", null)
        .limit(1);

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function plateNumberTaken(plateNumber: string, excludeId?: string) {
    const supabase = await createSupabaseServer();
    let query = supabase
        .from("vehicles")
        .select("id")
        .eq("plate_number", plateNumber)
        .is("deleted_at", null)
        .limit(1);

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function equipmentManagementNumberTaken(managementNumber: string, excludeId?: string) {
    const supabase = await createSupabaseServer();
    let query = supabase
        .from("equipment_items")
        .select("id")
        .eq("management_number", managementNumber)
        .is("deleted_at", null)
        .limit(1);

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

async function employeeExists(employeeId: string) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("employees")
        .select("id")
        .eq("id", employeeId)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
}

export async function createEmployeeAction(
    values: EmployeeCreateValues
): Promise<ActionResult<keyof EmployeeCreateValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeCreateSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeCreateValues>(parsed.error),
        };
    }

    try {
        if (await employeeNumberTaken(parsed.data.employee_number.trim())) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_number: "この社員番号は既に使用されています。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employees")
            .insert([toEmployeeInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create employee:", error);
            return { success: false, error: "社員の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.name} (${parsed.data.employee_number}) を登録`,
            metadata: {
                employee_number: parsed.data.employee_number.trim(),
                branch: parsed.data.branch?.trim() || null,
            },
        });
        revalidateEmployeePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating employee:", error);
        return { success: false, error: "社員の登録に失敗しました。" };
    }
}

export async function updateEmployeeAction(
    employeeId: string,
    values: EmployeeUpdateValues
): Promise<ActionResult<keyof EmployeeUpdateValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeUpdateSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeUpdateValues>(parsed.error),
        };
    }

    try {
        if (await employeeNumberTaken(parsed.data.employee_number.trim(), employeeId)) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_number: "この社員番号は既に使用されています。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employees")
            .update(toEmployeeUpdate(parsed.data))
            .eq("id", employeeId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update employee:", error);
            return { success: false, error: "社員情報の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "社員情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee",
            entityId: employeeId,
            action: "update",
            summary: `${parsed.data.name} (${parsed.data.employee_number}) を更新`,
            metadata: {
                employee_number: parsed.data.employee_number.trim(),
                branch: parsed.data.branch?.trim() || null,
            },
        });
        revalidateEmployeePaths(employeeId);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating employee:", error);
        return { success: false, error: "社員情報の更新に失敗しました。" };
    }
}

export async function createEmployeeFamilyAction(
    values: EmployeeFamilyValues
): Promise<ActionResult<keyof EmployeeFamilyValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeFamilySchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeFamilyValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_family")
            .insert([toEmployeeFamilyInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create employee family:", error);
            return { success: false, error: "家族情報の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_family",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.name} を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
                relationship: parsed.data.relationship || null,
                is_emergency_contact: parsed.data.is_emergency_contact,
            },
        });
        revalidateFamilyPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating employee family:", error);
        return { success: false, error: "家族情報の登録に失敗しました。" };
    }
}

export async function updateEmployeeFamilyAction(
    familyId: string,
    values: EmployeeFamilyValues
): Promise<ActionResult<keyof EmployeeFamilyValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeFamilySchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeFamilyValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_family")
            .update(toEmployeeFamilyUpdate(parsed.data))
            .eq("id", familyId)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update employee family:", error);
            return { success: false, error: "家族情報の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "家族情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_family",
            entityId: familyId,
            action: "update",
            summary: `${parsed.data.name} を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
                relationship: parsed.data.relationship || null,
                is_emergency_contact: parsed.data.is_emergency_contact,
            },
        });
        revalidateFamilyPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating employee family:", error);
        return { success: false, error: "家族情報の更新に失敗しました。" };
    }
}

export async function createVehicleAction(
    values: VehicleValues
): Promise<ActionResult<keyof VehicleValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = vehicleSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof VehicleValues>(parsed.error),
        };
    }

    try {
        if (await plateNumberTaken(parsed.data.plate_number.trim())) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { plate_number: "このナンバーは既に登録されています。" },
            };
        }

        if (parsed.data.primary_user_id && !(await employeeExists(parsed.data.primary_user_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { primary_user_id: "主使用者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("vehicles")
            .insert([toVehicleInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create vehicle:", error);
            return { success: false, error: "車両の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "vehicle",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.plate_number.trim()} を登録`,
            metadata: {
                plate_number: parsed.data.plate_number.trim(),
                primary_user_id: parsed.data.primary_user_id || null,
            },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating vehicle:", error);
        return { success: false, error: "車両の登録に失敗しました。" };
    }
}

export async function updateVehicleAction(
    vehicleId: string,
    values: VehicleValues
): Promise<ActionResult<keyof VehicleValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = vehicleSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof VehicleValues>(parsed.error),
        };
    }

    try {
        if (await plateNumberTaken(parsed.data.plate_number.trim(), vehicleId)) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { plate_number: "このナンバーは既に登録されています。" },
            };
        }

        if (parsed.data.primary_user_id && !(await employeeExists(parsed.data.primary_user_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { primary_user_id: "主使用者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("vehicles")
            .update(toVehicleUpdate(parsed.data))
            .eq("id", vehicleId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update vehicle:", error);
            return { success: false, error: "車両情報の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "車両情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "vehicle",
            entityId: vehicleId,
            action: "update",
            summary: `${parsed.data.plate_number.trim()} を更新`,
            metadata: {
                plate_number: parsed.data.plate_number.trim(),
                primary_user_id: parsed.data.primary_user_id || null,
            },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating vehicle:", error);
        return { success: false, error: "車両情報の更新に失敗しました。" };
    }
}

export async function createProjectAction(
    values: ProjectValues
): Promise<ActionResult<keyof ProjectValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof ProjectValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "担当者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("construction_records")
            .insert([toProjectInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create project:", error);
            return { success: false, error: "工事記録の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "construction_record",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.construction_name.trim()} を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
                construction_date: parsed.data.construction_date,
                category: parsed.data.category,
                client_name: parsed.data.client_name,
                equipment_types: parsed.data.equipment_types,
                work_type: parsed.data.work_type,
            },
        });
        revalidateProjectPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating project:", error);
        return { success: false, error: "工事記録の登録に失敗しました。" };
    }
}

export async function updateProjectAction(
    recordId: string,
    values: ProjectValues
): Promise<ActionResult<keyof ProjectValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof ProjectValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "担当者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("construction_records")
            .update(toProjectUpdate(parsed.data))
            .eq("id", recordId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update project:", error);
            return { success: false, error: "工事記録の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "工事記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "construction_record",
            entityId: recordId,
            action: "update",
            summary: `${parsed.data.construction_name.trim()} を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
                construction_date: parsed.data.construction_date,
                category: parsed.data.category,
                client_name: parsed.data.client_name,
                equipment_types: parsed.data.equipment_types,
                work_type: parsed.data.work_type,
            },
        });
        revalidateProjectPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating project:", error);
        return { success: false, error: "工事記録の更新に失敗しました。" };
    }
}

export async function createHealthCheckAction(
    values: HealthCheckValues
): Promise<ActionResult<keyof HealthCheckValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = healthCheckSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof HealthCheckValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("health_checks")
            .insert([toHealthCheckInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create health check:", error);
            return { success: false, error: "健康診断記録の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "health_check",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.check_date} の健康診断を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
                check_type: parsed.data.check_type,
                is_normal: parsed.data.is_normal === "true",
            },
        });
        revalidateHealthCheckPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating health check:", error);
        return { success: false, error: "健康診断記録の登録に失敗しました。" };
    }
}

export async function updateHealthCheckAction(
    healthCheckId: string,
    values: HealthCheckValues
): Promise<ActionResult<keyof HealthCheckValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = healthCheckSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof HealthCheckValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("health_checks")
            .update(toHealthCheckUpdate(parsed.data))
            .eq("id", healthCheckId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update health check:", error);
            return { success: false, error: "健康診断記録の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "健康診断記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "health_check",
            entityId: healthCheckId,
            action: "update",
            summary: `${parsed.data.check_date} の健康診断を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
                check_type: parsed.data.check_type,
                is_normal: parsed.data.is_normal === "true",
            },
        });
        revalidateHealthCheckPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating health check:", error);
        return { success: false, error: "健康診断記録の更新に失敗しました。" };
    }
}

export async function createAlcoholCheckAction(
    values: AlcoholCheckValues
): Promise<ActionResult<keyof AlcoholCheckValues>> {
    const snap = await getAuthSnapshot();
    if (!snap.user) {
        return { success: false, error: "この操作を実行する権限がありません。" };
    }

    const isManager = snap.role === "admin" || snap.role === "hr";
    const isTechnicianSelf =
        snap.role === "technician" && !!snap.linkedEmployeeId;

    if (!isManager && !isTechnicianSelf) {
        return { success: false, error: "この操作を実行する権限がありません。" };
    }

    const parsed = alcoholCheckSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof AlcoholCheckValues>(parsed.error),
        };
    }

    if (isTechnicianSelf && snap.linkedEmployeeId) {
        if (
            parsed.data.employee_id !== snap.linkedEmployeeId
            || parsed.data.checker_id !== snap.linkedEmployeeId
        ) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: {
                    employee_id: "技術者アカウントでは本人のみ記録できます。",
                    checker_id: "確認者は本人を選択してください。",
                },
            };
        }
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }
        if (!(await employeeExists(parsed.data.checker_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { checker_id: "確認者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("alcohol_checks")
            .insert([toAlcoholCheckInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create alcohol check:", error);
            return { success: false, error: "アルコールチェックの登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: snap.user.id,
            actorEmail: snap.user.email,
            entityType: "alcohol_check",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.check_datetime} のアルコール記録を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
                checker_id: parsed.data.checker_id,
                is_abnormal: parsed.data.is_abnormal === "不適正",
                location: parsed.data.location?.trim() || null,
            },
        });
        revalidateAlcoholCheckPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating alcohol check:", error);
        return { success: false, error: "アルコールチェックの登録に失敗しました。" };
    }
}

export async function updateAlcoholCheckAction(
    alcoholCheckId: string,
    values: AlcoholCheckValues
): Promise<ActionResult<keyof AlcoholCheckValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = alcoholCheckSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof AlcoholCheckValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }
        if (!(await employeeExists(parsed.data.checker_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { checker_id: "確認者が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("alcohol_checks")
            .update(toAlcoholCheckUpdate(parsed.data))
            .eq("id", alcoholCheckId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update alcohol check:", error);
            return { success: false, error: "アルコールチェックの更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "アルコールチェック記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "alcohol_check",
            entityId: alcoholCheckId,
            action: "update",
            summary: `${parsed.data.check_datetime} のアルコール記録を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
                checker_id: parsed.data.checker_id,
                is_abnormal: parsed.data.is_abnormal === "不適正",
                location: parsed.data.location?.trim() || null,
            },
        });
        revalidateAlcoholCheckPaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating alcohol check:", error);
        return { success: false, error: "アルコールチェックの更新に失敗しました。" };
    }
}

type DeleteActionResult =
    | { success: true }
    | { success: false; error: string };

export async function deleteQualificationAction(qualificationId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: qualification, error: fetchError } = await supabase
            .from("employee_qualifications")
            .select(`
                employee_id,
                certificate_url,
                qualification_master(name)
            `)
            .eq("id", qualificationId)
            .maybeSingle();

        if (fetchError || !qualification) {
            console.error("Failed to load qualification before delete:", fetchError);
            return { success: false, error: "資格情報が見つかりません。" };
        }

        const { data: deletedQualification, error } = await supabase
            .from("employee_qualifications")
            .delete()
            .eq("id", qualificationId)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to delete qualification:", error);
            return { success: false, error: "資格情報の削除に失敗しました。" };
        }
        if (!deletedQualification) {
            return { success: false, error: "資格情報が見つかりません。" };
        }

        if (qualification.certificate_url) {
            const { error: storageError } = await supabase.storage
                .from("certificates")
                .remove([qualification.certificate_url]);

            if (storageError) {
                console.error("Failed to delete qualification certificate:", storageError);
            }
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_qualification",
            entityId: qualificationId,
            action: "delete",
            summary: `${qualification.qualification_master?.name || "資格"} を削除`,
            metadata: { employee_id: qualification.employee_id || null },
        });
        revalidateEmployeePaths(qualification.employee_id || undefined);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting qualification:", error);
        return { success: false, error: "資格情報の削除に失敗しました。" };
    }
}

export async function deleteVehicleAction(vehicleId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: vehicle, error: fetchError } = await supabase
            .from("vehicles")
            .select("plate_number")
            .eq("id", vehicleId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !vehicle) {
            console.error("Failed to load vehicle before delete:", fetchError);
            return { success: false, error: "車両情報が見つかりません。" };
        }

        const deletedAt = new Date().toISOString();
        const { data: deletedVehicle, error } = await supabase
            .from("vehicles")
            .update({
                deleted_at: deletedAt,
                deleted_by: auth.user.id,
            })
            .eq("id", vehicleId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to soft delete vehicle:", error);
            return { success: false, error: "車両の削除に失敗しました。" };
        }
        if (!deletedVehicle) {
            return { success: false, error: "車両情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "vehicle",
            entityId: vehicleId,
            action: "delete",
            summary: `${vehicle.plate_number} を削除`,
            metadata: { plate_number: vehicle.plate_number },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting vehicle:", error);
        return { success: false, error: "車両の削除に失敗しました。" };
    }
}

export async function createEquipmentAction(
    values: EquipmentValues
): Promise<ActionResult<keyof EquipmentValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = equipmentSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EquipmentValues>(parsed.error),
        };
    }

    try {
        if (await equipmentManagementNumberTaken(parsed.data.management_number.trim())) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { management_number: "この管理番号は既に登録されています。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("equipment_items")
            .insert([toEquipmentInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create equipment:", error);
            return { success: false, error: "備品の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "equipment_item",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.management_number.trim()} ${parsed.data.name.trim()} を登録`,
            metadata: { management_number: parsed.data.management_number.trim() },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating equipment:", error);
        return { success: false, error: "備品の登録に失敗しました。" };
    }
}

export async function updateEquipmentAction(
    equipmentId: string,
    values: EquipmentValues
): Promise<ActionResult<keyof EquipmentValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = equipmentSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EquipmentValues>(parsed.error),
        };
    }

    try {
        if (await equipmentManagementNumberTaken(parsed.data.management_number.trim(), equipmentId)) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { management_number: "この管理番号は既に登録されています。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("equipment_items")
            .update(toEquipmentUpdate(parsed.data))
            .eq("id", equipmentId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update equipment:", error);
            return { success: false, error: "備品情報の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "備品情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "equipment_item",
            entityId: equipmentId,
            action: "update",
            summary: `${parsed.data.management_number.trim()} を更新`,
            metadata: { management_number: parsed.data.management_number.trim() },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating equipment:", error);
        return { success: false, error: "備品情報の更新に失敗しました。" };
    }
}

export async function deleteEquipmentAction(equipmentId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: row, error: fetchError } = await supabase
            .from("equipment_items")
            .select("management_number, name")
            .eq("id", equipmentId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !row) {
            console.error("Failed to load equipment before delete:", fetchError);
            return { success: false, error: "備品情報が見つかりません。" };
        }

        const deletedAt = new Date().toISOString();
        const { data: updated, error } = await supabase
            .from("equipment_items")
            .update({
                deleted_at: deletedAt,
                deleted_by: auth.user.id,
            })
            .eq("id", equipmentId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to soft delete equipment:", error);
            return { success: false, error: "備品の削除に失敗しました。" };
        }
        if (!updated) {
            return { success: false, error: "備品情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "equipment_item",
            entityId: equipmentId,
            action: "delete",
            summary: `${row.management_number} を削除`,
            metadata: { management_number: row.management_number, name: row.name },
        });
        revalidateVehiclePaths();
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting equipment:", error);
        return { success: false, error: "備品の削除に失敗しました。" };
    }
}

export async function deleteProjectAction(recordId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: record, error: fetchError } = await supabase
            .from("construction_records")
            .select("construction_name, employee_id")
            .eq("id", recordId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !record) {
            console.error("Failed to load project before delete:", fetchError);
            return { success: false, error: "工事記録が見つかりません。" };
        }

        const deletedAt = new Date().toISOString();
        const { data: deletedRecord, error } = await supabase
            .from("construction_records")
            .update({
                deleted_at: deletedAt,
                deleted_by: auth.user.id,
            })
            .eq("id", recordId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to soft delete project:", error);
            return { success: false, error: "工事記録の削除に失敗しました。" };
        }
        if (!deletedRecord) {
            return { success: false, error: "工事記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "construction_record",
            entityId: recordId,
            action: "delete",
            summary: `${record.construction_name} を削除`,
            metadata: { employee_id: record.employee_id || null },
        });
        revalidateProjectPaths(record.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting project:", error);
        return { success: false, error: "工事記録の削除に失敗しました。" };
    }
}

export async function deleteHealthCheckAction(healthCheckId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: record, error: fetchError } = await supabase
            .from("health_checks")
            .select("employee_id, check_date")
            .eq("id", healthCheckId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !record) {
            console.error("Failed to load health check before delete:", fetchError);
            return { success: false, error: "健康診断記録が見つかりません。" };
        }

        const deletedAt = new Date().toISOString();
        const { data: deletedRecord, error } = await supabase
            .from("health_checks")
            .update({
                deleted_at: deletedAt,
                deleted_by: auth.user.id,
            })
            .eq("id", healthCheckId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to soft delete health check:", error);
            return { success: false, error: "健康診断記録の削除に失敗しました。" };
        }
        if (!deletedRecord) {
            return { success: false, error: "健康診断記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "health_check",
            entityId: healthCheckId,
            action: "delete",
            summary: `${record.check_date} の健康診断を削除`,
            metadata: { employee_id: record.employee_id || null },
        });
        revalidateHealthCheckPaths(record.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting health check:", error);
        return { success: false, error: "健康診断記録の削除に失敗しました。" };
    }
}

export async function deleteAlcoholCheckAction(alcoholCheckId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: record, error: fetchError } = await supabase
            .from("alcohol_checks")
            .select("employee_id, check_datetime")
            .eq("id", alcoholCheckId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !record) {
            console.error("Failed to load alcohol check before delete:", fetchError);
            return { success: false, error: "アルコールチェック記録が見つかりません。" };
        }

        const deletedAt = new Date().toISOString();
        const { data: deletedRecord, error } = await supabase
            .from("alcohol_checks")
            .update({
                deleted_at: deletedAt,
                deleted_by: auth.user.id,
            })
            .eq("id", alcoholCheckId)
            .is("deleted_at", null)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to soft delete alcohol check:", error);
            return { success: false, error: "アルコールチェック記録の削除に失敗しました。" };
        }
        if (!deletedRecord) {
            return { success: false, error: "アルコールチェック記録が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "alcohol_check",
            entityId: alcoholCheckId,
            action: "delete",
            summary: `${record.check_datetime || "記録"} を削除`,
            metadata: { employee_id: record.employee_id || null },
        });
        revalidateAlcoholCheckPaths(record.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting alcohol check:", error);
        return { success: false, error: "アルコールチェック記録の削除に失敗しました。" };
    }
}

export async function deleteEmployeeAction(employeeId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: employee, error: fetchError } = await supabase
            .from("employees")
            .select("name, employee_number")
            .eq("id", employeeId)
            .is("deleted_at", null)
            .maybeSingle();

        if (fetchError || !employee) {
            console.error("Failed to load employee before delete:", fetchError);
            return { success: false, error: "社員情報が見つかりません。" };
        }

        const { data: deleted, error } = await supabase.rpc("soft_delete_employee", {
            p_employee_id: employeeId,
            p_deleted_by: auth.user.id,
        });

        if (error) {
            console.error("Failed to soft delete employee:", error);
            return { success: false, error: "社員の削除に失敗しました。" };
        }
        if (!deleted) {
            return { success: false, error: "社員情報が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee",
            entityId: employeeId,
            action: "delete",
            summary: `${employee.name} (${employee.employee_number}) を削除`,
            metadata: { employee_number: employee.employee_number },
        });
        revalidateEmployeePaths(employeeId);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting employee:", error);
        return { success: false, error: "社員の削除に失敗しました。" };
    }
}

export async function deleteEmployeeFamilyAction(familyId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: family, error: fetchError } = await supabase
            .from("employee_family")
            .select("name, employee_id")
            .eq("id", familyId)
            .maybeSingle();

        if (fetchError || !family) {
            return { success: false, error: "家族情報が見つかりません。" };
        }

        const { error } = await supabase
            .from("employee_family")
            .delete()
            .eq("id", familyId);

        if (error) {
            console.error("Failed to delete employee family:", error);
            return { success: false, error: "家族情報の削除に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_family",
            entityId: familyId,
            action: "delete",
            summary: `${family.name} を削除`,
            metadata: { employee_id: family.employee_id },
        });
        revalidateFamilyPaths(family.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting employee family:", error);
        return { success: false, error: "家族情報の削除に失敗しました。" };
    }
}

// =====================
// INSURANCE ACTIONS
// =====================

export async function createLifeInsuranceAction(
    values: LifeInsuranceValues
): Promise<ActionResult<keyof LifeInsuranceValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = lifeInsuranceSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof LifeInsuranceValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_life_insurances")
            .insert([toLifeInsuranceInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create life insurance:", error);
            return { success: false, error: "生命保険の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "life_insurance",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.insurance_name} を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
                insurance_company: parsed.data.insurance_company,
            },
        });
        revalidateInsurancePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating life insurance:", error);
        return { success: false, error: "生命保険の登録に失敗しました。" };
    }
}

export async function updateLifeInsuranceAction(
    insuranceId: string,
    values: LifeInsuranceValues
): Promise<ActionResult<keyof LifeInsuranceValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = lifeInsuranceSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof LifeInsuranceValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_life_insurances")
            .update(toLifeInsuranceUpdate(parsed.data))
            .eq("id", insuranceId)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update life insurance:", error);
            return { success: false, error: "生命保険の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "生命保険が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "life_insurance",
            entityId: insuranceId,
            action: "update",
            summary: `${parsed.data.insurance_name} を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
            },
        });
        revalidateInsurancePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating life insurance:", error);
        return { success: false, error: "生命保険の更新に失敗しました。" };
    }
}

export async function deleteLifeInsuranceAction(insuranceId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        
        const { data: insurance, error: fetchError } = await supabase
            .from("employee_life_insurances")
            .select("insurance_name, employee_id")
            .eq("id", insuranceId)
            .maybeSingle();

        if (fetchError || !insurance) {
            return { success: false, error: "生命保険が見つかりません。" };
        }

        const { error } = await supabase
            .from("employee_life_insurances")
            .delete()
            .eq("id", insuranceId);

        if (error) {
            console.error("Failed to delete life insurance:", error);
            return { success: false, error: "生命保険の削除に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "life_insurance",
            entityId: insuranceId,
            action: "delete",
            summary: `${insurance.insurance_name} を削除`,
            metadata: { employee_id: insurance.employee_id },
        });
        
        revalidateInsurancePaths(insurance.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting life insurance:", error);
        return { success: false, error: "生命保険の削除に失敗しました。" };
    }
}

export async function createDamageInsuranceAction(
    values: DamageInsuranceValues
): Promise<ActionResult<keyof DamageInsuranceValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = damageInsuranceSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof DamageInsuranceValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_damage_insurances")
            .insert([toDamageInsuranceInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create damage insurance:", error);
            return { success: false, error: "損害保険の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "damage_insurance",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.insurance_name} を登録`,
            metadata: {
                employee_id: parsed.data.employee_id,
            },
        });
        revalidateInsurancePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating damage insurance:", error);
        return { success: false, error: "損害保険の登録に失敗しました。" };
    }
}

export async function updateDamageInsuranceAction(
    insuranceId: string,
    values: DamageInsuranceValues
): Promise<ActionResult<keyof DamageInsuranceValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = damageInsuranceSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof DamageInsuranceValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_damage_insurances")
            .update(toDamageInsuranceUpdate(parsed.data))
            .eq("id", insuranceId)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("Failed to update damage insurance:", error);
            return { success: false, error: "損害保険の更新に失敗しました。" };
        }
        if (!data) {
            return { success: false, error: "損害保険が見つかりません。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "damage_insurance",
            entityId: insuranceId,
            action: "update",
            summary: `${parsed.data.insurance_name} を更新`,
            metadata: {
                employee_id: parsed.data.employee_id,
            },
        });
        revalidateInsurancePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating damage insurance:", error);
        return { success: false, error: "損害保険の更新に失敗しました。" };
    }
}

export async function deleteDamageInsuranceAction(insuranceId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        
        const { data: insurance, error: fetchError } = await supabase
            .from("employee_damage_insurances")
            .select("insurance_name, employee_id")
            .eq("id", insuranceId)
            .maybeSingle();

        if (fetchError || !insurance) {
            return { success: false, error: "損害保険が見つかりません。" };
        }

        const { error } = await supabase
            .from("employee_damage_insurances")
            .delete()
            .eq("id", insuranceId);

        if (error) {
            console.error("Failed to delete damage insurance:", error);
            return { success: false, error: "損害保険の削除に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "damage_insurance",
            entityId: insuranceId,
            action: "delete",
            summary: `${insurance.insurance_name} を削除`,
            metadata: { employee_id: insurance.employee_id },
        });
        
        revalidateInsurancePaths(insurance.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting damage insurance:", error);
        return { success: false, error: "損害保険の削除に失敗しました。" };
    }
}

export async function createItAccountAction(
    values: EmployeeItAccountValues
): Promise<ActionResult<keyof EmployeeItAccountValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeItAccountSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeItAccountValues>(parsed.error),
        };
    }

    try {
        if (!(await employeeExists(parsed.data.employee_id))) {
            return {
                success: false,
                error: "入力内容を確認してください。",
                fieldErrors: { employee_id: "対象社員が見つかりません。" },
            };
        }

        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employee_it_accounts")
            .insert([toItAccountInsert(parsed.data)])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create IT account row:", error);
            return { success: false, error: "IT利用情報の登録に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_it_account",
            entityId: data.id,
            action: "create",
            summary: `${parsed.data.service_name} を登録`,
            metadata: { employee_id: parsed.data.employee_id },
        });
        revalidateEmployeePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating IT account:", error);
        return { success: false, error: "IT利用情報の登録に失敗しました。" };
    }
}

export async function updateItAccountAction(
    accountId: string,
    values: EmployeeItAccountValues
): Promise<ActionResult<keyof EmployeeItAccountValues>> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const parsed = employeeItAccountSchema.safeParse(values);
    if (!parsed.success) {
        return {
            success: false,
            error: "入力内容を確認してください。",
            fieldErrors: getFieldErrors<keyof EmployeeItAccountValues>(parsed.error),
        };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: existing, error: fetchError } = await supabase
            .from("employee_it_accounts")
            .select("id, employee_id")
            .eq("id", accountId)
            .maybeSingle();

        if (fetchError || !existing) {
            return { success: false, error: "IT利用情報が見つかりません。" };
        }

        if (existing.employee_id !== parsed.data.employee_id) {
            return { success: false, error: "不正な操作です。" };
        }

        const { error } = await supabase
            .from("employee_it_accounts")
            .update(toItAccountUpdate(parsed.data))
            .eq("id", accountId);

        if (error) {
            console.error("Failed to update IT account:", error);
            return { success: false, error: "IT利用情報の更新に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_it_account",
            entityId: accountId,
            action: "update",
            summary: `${parsed.data.service_name} を更新`,
            metadata: { employee_id: parsed.data.employee_id },
        });
        revalidateEmployeePaths(parsed.data.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating IT account:", error);
        return { success: false, error: "IT利用情報の更新に失敗しました。" };
    }
}

export async function deleteItAccountAction(accountId: string): Promise<DeleteActionResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const supabase = await createSupabaseServer();
        const { data: row, error: fetchError } = await supabase
            .from("employee_it_accounts")
            .select("service_name, employee_id")
            .eq("id", accountId)
            .maybeSingle();

        if (fetchError || !row) {
            return { success: false, error: "IT利用情報が見つかりません。" };
        }

        const { error } = await supabase.from("employee_it_accounts").delete().eq("id", accountId);

        if (error) {
            console.error("Failed to delete IT account:", error);
            return { success: false, error: "IT利用情報の削除に失敗しました。" };
        }

        await recordAuditLog({
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            entityType: "employee_it_account",
            entityId: accountId,
            action: "delete",
            summary: `${row.service_name} を削除`,
            metadata: { employee_id: row.employee_id },
        });
        revalidateEmployeePaths(row.employee_id);
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting IT account:", error);
        return { success: false, error: "IT利用情報の削除に失敗しました。" };
    }
}
