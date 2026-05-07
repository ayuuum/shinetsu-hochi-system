import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getAlertLevel, type AlertLevel } from "@/lib/alert-utils";
import type { Tables } from "@/types/supabase";

// Dashboard data types
export type DashboardEmployee = Pick<Tables<"employees">, "id" | "name" | "hire_date" | "branch" | "termination_date">;

export type DashboardQualification = Pick<Tables<"employee_qualifications">, "id" | "employee_id" | "expiry_date"> & {
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
    qualification_master: Pick<Tables<"qualification_master">, "name" | "category"> | null;
};

export type DashboardVehicle = Pick<
    Tables<"vehicles">,
    "id" | "plate_number" | "vehicle_name" | "inspection_expiry" | "liability_insurance_expiry" | "voluntary_insurance_expiry"
>;

export type DashboardHealthCheck = Pick<Tables<"health_checks">, "id" | "check_date" | "check_type" | "hospital_name"> & {
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
};

export type CachedPage<T> = {
    items: T[];
    hasNextPage: boolean;
};

type CachedProjectRow = Tables<"construction_records"> & {
    employees: Pick<Tables<"employees">, "id" | "name" | "branch"> | null;
};

type CachedHealthCheckRow = Tables<"health_checks"> & {
    employees: Pick<Tables<"employees">, "id" | "name" | "branch"> | null;
};

const LIST_PAGE_SIZE = 50;

// Qualification categories — changes only when qualification master is edited
export const getCachedQualificationCategories = unstable_cache(
    async (): Promise<string[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("qualification_master")
            .select("category")
            .not("category", "is", null)
            .order("category");
        return [...new Set((data || []).map((d) => d.category).filter(Boolean))] as string[];
    },
    ["qual-categories"],
    { revalidate: 300, tags: ["qualification-master"] }
);

// Full qualification master list for dropdowns
export const getCachedQualificationMasters = unstable_cache(
    async () => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("qualification_master")
            .select("*")
            .order("category");
        return data || [];
    },
    ["qual-masters"],
    { revalidate: 300, tags: ["qualification-master"] }
);

// Employee list for dropdowns — changes when employees are added/removed/updated
export const getCachedEmployeeList = unstable_cache(
    async (): Promise<{ id: string; name: string; branch: string | null }[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("employees")
            .select("id, name, branch")
            .is("deleted_at", null)
            .order("branch")
            .order("name");
        return (data || []) as { id: string; name: string; branch: string | null }[];
    },
    ["employee-list"],
    { revalidate: 300, tags: ["employees"] }
);

export const getCachedProjectsPage = unstable_cache(
    async (page: number): Promise<CachedPage<CachedProjectRow>> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return { items: [], hasNextPage: false };

        const from = (page - 1) * LIST_PAGE_SIZE;
        const toPlusOne = from + LIST_PAGE_SIZE;
        const { data } = await supabase
            .from("construction_records")
            .select("*, employees!inner(id, name, branch)")
            .is("deleted_at", null)
            .is("employees.deleted_at", null)
            .order("construction_date", { ascending: false })
            .range(from, toPlusOne);

        const items = ((data || []) as unknown as CachedProjectRow[]);
        return {
            items: items.slice(0, LIST_PAGE_SIZE),
            hasNextPage: items.length > LIST_PAGE_SIZE,
        };
    },
    ["projects-page"],
    { revalidate: 300, tags: ["projects", "employees"] }
);

export const getCachedHealthChecksPage = unstable_cache(
    async (page: number): Promise<CachedPage<CachedHealthCheckRow>> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return { items: [], hasNextPage: false };

        const from = (page - 1) * LIST_PAGE_SIZE;
        const toPlusOne = from + LIST_PAGE_SIZE;
        const { data } = await supabase
            .from("health_checks")
            .select("*, employees!inner(id, name, branch)")
            .is("deleted_at", null)
            .is("employees.deleted_at", null)
            .order("check_date", { ascending: false })
            .range(from, toPlusOne);

        const items = ((data || []) as unknown as CachedHealthCheckRow[]);
        return {
            items: items.slice(0, LIST_PAGE_SIZE),
            hasNextPage: items.length > LIST_PAGE_SIZE,
        };
    },
    ["health-checks-page"],
    { revalidate: 300, tags: ["health-checks", "employees"] }
);

// Pre-aggregated alert counts (no filter) — used for badge tabs on qualifications page
export const getCachedQualificationCounts = unstable_cache(
    async (): Promise<Record<AlertLevel, number>> => {
        const supabase = createSupabaseAdmin();
        const empty: Record<AlertLevel, number> = { danger: 0, urgent: 0, warning: 0, info: 0, ok: 0 };
        if (!supabase) return empty;
        const { data } = await supabase
            .from("employee_qualifications")
            .select("expiry_date, employees!inner(id)")
            .is("employees.deleted_at", null)
            .is("deleted_at", null);
        const counts = { ...empty };
        for (const row of data || []) {
            counts[getAlertLevel((row as { expiry_date: string | null }).expiry_date)] += 1;
        }
        return counts;
    },
    ["qual-counts"],
    { revalidate: 300, tags: ["qualifications", "employees"] }
);

// Qual counts per employee — used to eliminate RT3 waterfall on employees page
export const getCachedQualCountsByEmployee = unstable_cache(
    async (): Promise<Record<string, { total: number; expiring: number }>> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return {};
        const { data } = await supabase
            .from("employee_qualifications")
            .select("employee_id, expiry_date")
            .is("deleted_at", null);
        const now = new Date();
        const result: Record<string, { total: number; expiring: number }> = {};
        for (const q of data || []) {
            if (!q.employee_id) continue;
            const entry = result[q.employee_id] ?? { total: 0, expiring: 0 };
            entry.total += 1;
            if (q.expiry_date) {
                const diff = new Date(q.expiry_date).getTime() - now.getTime();
                if (diff < 30 * 24 * 60 * 60 * 1000) entry.expiring += 1;
            }
            result[q.employee_id] = entry;
        }
        return result;
    },
    ["qual-counts-by-employee"],
    { revalidate: 300, tags: ["qualifications", "employees"] }
);

// ---- Dashboard-level cached queries ----

// 全社員（アクティブ判定・入社月フィルタ用）
export const getCachedDashboardEmployees = unstable_cache(
    async (): Promise<DashboardEmployee[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("employees")
            .select("id, name, hire_date, branch, termination_date")
            .is("deleted_at", null);
        return (data || []) as DashboardEmployee[];
    },
    ["dashboard-employees"],
    { revalidate: 300, tags: ["employees"] }
);

// 資格 + employees JOIN（ダッシュボードのアラート・スケジュール用）
export const getCachedDashboardQualifications = unstable_cache(
    async (): Promise<DashboardQualification[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("employee_qualifications")
            .select(`
                id,
                employee_id,
                expiry_date,
                employees!inner(id, name, branch),
                qualification_master(name, category)
            `)
            .is("employees.deleted_at", null)
            .is("deleted_at", null)
            .not("expiry_date", "is", null)
            .order("expiry_date", { ascending: true });
        return (data || []) as unknown as DashboardQualification[];
    },
    ["dashboard-qualifications"],
    { revalidate: 120, tags: ["qualifications", "employees"] }
);

// 車両（全件）
export const getCachedDashboardVehicles = unstable_cache(
    async (): Promise<DashboardVehicle[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("vehicles")
            .select("id, plate_number, vehicle_name, inspection_expiry, liability_insurance_expiry, voluntary_insurance_expiry")
            .is("deleted_at", null)
            .order("inspection_expiry", { ascending: true });
        return (data || []) as DashboardVehicle[];
    },
    ["dashboard-vehicles"],
    { revalidate: 300, tags: ["vehicles"] }
);

// 当月の健診（月単位でキャッシュ: key に monthStart-monthEnd を含む）
export const getCachedMonthlyHealthChecks = unstable_cache(
    async (monthStart: string, monthEnd: string): Promise<DashboardHealthCheck[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("health_checks")
            .select(`
                id,
                check_date,
                check_type,
                hospital_name,
                employees(name, branch)
            `)
            .is("deleted_at", null)
            .gte("check_date", monthStart)
            .lte("check_date", monthEnd)
            .order("check_date", { ascending: true })
            .limit(100);
        return (data || []) as unknown as DashboardHealthCheck[];
    },
    ["dashboard-monthly-health"],
    { revalidate: 300, tags: ["health-checks", "employees"] }
);

// Annual schedules — parameterized by fiscal year, invalidated on schedule CRUD
export const getCachedSchedulesByFiscalYear = unstable_cache(
    async (fiscalYear: number) => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("annual_schedules")
            .select("*")
            .eq("fiscal_year", fiscalYear)
            .order("scheduled_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true });
        return data || [];
    },
    ["annual-schedules"],
    { revalidate: 300, tags: ["annual-schedules"] }
);
