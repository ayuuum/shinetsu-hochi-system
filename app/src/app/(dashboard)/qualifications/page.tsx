import { addDays } from "date-fns";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { QualificationsClient, type QualificationRow } from "@/components/qualifications/qualifications-client";
import { formatDateInTokyo, getTodayInTokyo } from "@/lib/date";
import { getAlertLevel, type AlertLevel } from "@/lib/alert-utils";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildInCondition(column: string, ids: string[]) {
    return ids.length > 0 ? `${column}.in.(${ids.join(",")})` : null;
}

function buildBooleanGroup(operator: "or" | "and", conditions: string[]) {
    if (conditions.length === 1) {
        return conditions[0];
    }

    return `${operator}(${conditions.join(",")})`;
}

export default async function QualificationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; category?: string; level?: AlertLevel | "all" }>;
}) {
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect("/me");
    }

    const params = await searchParams;
    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();
    const currentCategory = (params.category || "").trim();
    const currentLevel = params.level && params.level !== "all" ? params.level : "";

    let qualifications: QualificationRow[] = [];
    let categories: string[] = [];
    let counts: Record<AlertLevel, number> = {
        danger: 0,
        urgent: 0,
        warning: 0,
        info: 0,
        ok: 0,
    };
    let totalPages = 1;
    // Fix: fetch employees list to enable direct qualification addition from this page
    let employees: { id: string; name: string; branch: string | null }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const today = getTodayInTokyo();
        const urgentLimit = formatDateInTokyo(addDays(new Date(), 14));
        const warningLimit = formatDateInTokyo(addDays(new Date(), 30));
        const infoLimit = formatDateInTokyo(addDays(new Date(), 60));
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        const [
            categoryResult,
            employeeSearchResult,
            qualificationSearchResult,
            categoryQualificationResult,
            employeeListResult,
        ] = await Promise.all([
            supabase
                .from("qualification_master")
                .select("category")
                .not("category", "is", null)
                .order("category"),
            currentSearch
                ? supabase
                    .from("employees")
                    .select("id")
                    .is("deleted_at", null)
                    .ilike("name", searchPattern!)
                    .limit(100)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            currentSearch
                ? supabase
                    .from("qualification_master")
                    .select("id")
                    .ilike("name", searchPattern!)
                    .limit(100)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            currentCategory
                ? supabase
                    .from("qualification_master")
                    .select("id")
                    .eq("category", currentCategory)
                    .limit(500)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            supabase
                .from("employees")
                .select("id, name, branch")
                .is("deleted_at", null)
                .order("branch")
                .order("name"),
        ]);

        employees = (employeeListResult.data || []) as { id: string; name: string; branch: string | null }[];

        categories = [...new Set((categoryResult.data || []).map((item) => item.category).filter(Boolean))] as string[];

        const employeeIds = (employeeSearchResult.data || []).map((item) => item.id);
        const qualificationIds = (qualificationSearchResult.data || []).map((item) => item.id);
        const categoryQualificationIds = (categoryQualificationResult.data || []).map((item) => item.id);

        const searchConditions = [
            buildInCondition("employee_id", employeeIds),
            buildInCondition("qualification_id", qualificationIds),
        ].filter(Boolean) as string[];
        const searchGroup = searchConditions.length > 0 ? buildBooleanGroup("or", searchConditions) : null;

        const hasMatches = !currentSearch || searchConditions.length > 0;
        const hasCategoryMatches = !currentCategory || categoryQualificationIds.length > 0;

        if (hasMatches && hasCategoryMatches) {
            let pageQuery = supabase
                .from("employee_qualifications")
                .select(`
                    *,
                    employees!inner(id, name, branch),
                    qualification_master(name, category)
                `, { count: "exact" })
                .is("employees.deleted_at", null)
                .order("expiry_date", { ascending: true })
                .range(from, to);

            let summaryQuery = supabase
                .from("employee_qualifications")
                .select("expiry_date, employees!inner(id)")
                .is("employees.deleted_at", null);

            if (currentCategory) {
                pageQuery = pageQuery.in("qualification_id", categoryQualificationIds);
                summaryQuery = summaryQuery.in("qualification_id", categoryQualificationIds);
            }

            if (currentSearch) {
                summaryQuery = summaryQuery.or(searchConditions.join(","));

                if (currentLevel !== "ok") {
                    pageQuery = pageQuery.or(searchConditions.join(","));
                }
            }

            if (currentLevel === "danger") {
                pageQuery = pageQuery.lt("expiry_date", today);
            }
            if (currentLevel === "urgent") {
                pageQuery = pageQuery.gte("expiry_date", today).lte("expiry_date", urgentLimit);
            }
            if (currentLevel === "warning") {
                pageQuery = pageQuery.gt("expiry_date", urgentLimit).lte("expiry_date", warningLimit);
            }
            if (currentLevel === "info") {
                pageQuery = pageQuery.gt("expiry_date", warningLimit).lte("expiry_date", infoLimit);
            }
            if (currentLevel === "ok") {
                pageQuery = currentSearch && searchGroup
                    ? pageQuery.or(`and(${searchGroup},expiry_date.is.null),and(${searchGroup},expiry_date.gt.${infoLimit})`)
                    : pageQuery.or(`expiry_date.is.null,expiry_date.gt.${infoLimit}`);
            }

            const [pageResult, summaryResult] = await Promise.all([pageQuery, summaryQuery]);

            qualifications = (pageResult.data || []) as QualificationRow[];
            totalPages = Math.max(1, Math.ceil((pageResult.count || 0) / PAGE_SIZE));

            counts = (summaryResult.data || []).reduce<Record<AlertLevel, number>>((acc, row) => {
                const level = getAlertLevel(row.expiry_date);
                acc[level] += 1;
                return acc;
            }, {
                danger: 0,
                urgent: 0,
                warning: 0,
                info: 0,
                ok: 0,
            });
        }
    } catch (e) {
        console.error("Failed to load qualifications:", e);
    }

    return (
        <QualificationsClient
            initialQualifications={qualifications}
            categories={categories}
            counts={counts}
            currentSearch={currentSearch}
            currentCategory={currentCategory}
            currentLevel={currentLevel}
            currentPage={currentPage}
            totalPages={totalPages}
            employees={employees}
        />
    );
}
