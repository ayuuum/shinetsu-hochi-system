import "server-only";
import { unstable_cache } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

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

// Qualification summary counts (no filter) — used for alert level badges on qualifications page
export const getCachedQualificationSummary = unstable_cache(
    async (): Promise<{ expiry_date: string | null }[]> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) return [];
        const { data } = await supabase
            .from("employee_qualifications")
            .select("expiry_date, employees!inner(id)")
            .is("employees.deleted_at", null)
            .is("deleted_at", null);
        return (data || []) as { expiry_date: string | null }[];
    },
    ["qual-summary"],
    { revalidate: 300, tags: ["qualifications", "employees"] }
);
