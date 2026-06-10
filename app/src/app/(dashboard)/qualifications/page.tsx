import { addDays } from "date-fns";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { QualificationsClient, type QualificationRow } from "@/components/qualifications/qualifications-client";
import { formatDateInTokyo, getTodayInTokyo } from "@/lib/date";
import { getAlertLevel, type AlertLevel } from "@/lib/alert-utils";
import { getCachedQualificationCategories, getCachedEmployeeList, getCachedQualificationCounts, getCachedQualificationMasters } from "@/lib/cached-queries";
import { computeLicenseGroupRecord, type LicenseGroupInfo, type LicenseGroupInput } from "@/lib/license-groups";

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
    const params = await searchParams;

    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const toPlusOne = from + PAGE_SIZE;
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
    let hasNextPage = false;
    let employees: { id: string; name: string; branch: string | null }[] = [];
    let qualificationMasters: { id: string; name: string; category: string | null }[] = [];
    let licenseGroups: Record<string, LicenseGroupInfo> = {};

    try {
        // 資格・講習管理は一般アカウントも閲覧可能。RLS では本人分しか見えないため
        // サービスロールで全件取得する（結合する社員カラムは id/氏名/拠点のみ）。
        const supabase = createSupabaseAdmin();
        if (!supabase) throw new Error("Service role client is unavailable");

        // 同一免状（同じ社員×同じ免状番号）の最新版判定は全件を対象に算出する必要があるため、
        // 免状番号を持つ有効な資格を一覧取得しておく（ページネーションとは独立して並行実行）。
        const licenseGroupPromise = supabase
            .from("employee_qualifications")
            .select("id, employee_id, certificate_number, acquired_date, created_at, employees!inner(id)")
            .is("deleted_at", null)
            .is("employees.deleted_at", null)
            .not("certificate_number", "is", null)
            .limit(5000);
        const today = getTodayInTokyo();
        const urgentLimit = formatDateInTokyo(addDays(new Date(), 14));
        const warningLimit = formatDateInTokyo(addDays(new Date(), 30));
        const infoLimit = formatDateInTokyo(addDays(new Date(), 60));
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        // Build main queries early so they can run in parallel with lookup queries when no filter is active
        const basePageQuery = () => supabase
            .from("employee_qualifications")
            .select(`*, employees!inner(id, name, branch), qualification_master(name, category)`)
            .is("employees.deleted_at", null)
            .order("expiry_date", { ascending: true })
            .range(from, toPlusOne);

        const noFilter = !currentSearch && !currentCategory;

        let pageResult: { data: unknown[] | null; error: unknown };
        let summaryData: { expiry_date: string | null }[] = [];

        if (noFilter) {
            let pq = basePageQuery();
            if (currentLevel === "danger") pq = pq.lt("expiry_date", today);
            if (currentLevel === "urgent") pq = pq.gte("expiry_date", today).lte("expiry_date", urgentLimit);
            if (currentLevel === "warning") pq = pq.gt("expiry_date", urgentLimit).lte("expiry_date", warningLimit);
            if (currentLevel === "info") pq = pq.gt("expiry_date", warningLimit).lte("expiry_date", infoLimit);
            if (currentLevel === "ok") pq = pq.or("expiry_date.is.null,expiry_date.gt." + infoLimit);

            // All 4 are independent — run in one parallel group
            const [categories_cached, employees_cached, masters_cached, pqResult, cachedCounts] = await Promise.all([
                getCachedQualificationCategories(),
                getCachedEmployeeList(),
                getCachedQualificationMasters(),
                pq,
                getCachedQualificationCounts(),
            ]);
            categories = categories_cached;
            employees = employees_cached;
            qualificationMasters = masters_cached.map((m) => ({ id: m.id, name: m.name, category: m.category ?? null }));
            pageResult = pqResult as typeof pageResult;
            counts = cachedCounts;
        } else {
            // categories and employee list cached; search lookups are independent — run in one parallel group
            const [
                categories_cached,
                employees_cached,
                masters_cached,
                employeeSearchResult,
                qualificationSearchResult,
                categoryQualificationResult,
            ] = await Promise.all([
                getCachedQualificationCategories(),
                getCachedEmployeeList(),
                getCachedQualificationMasters(),
                currentSearch
                    ? supabase.from("employees").select("id").is("deleted_at", null).ilike("name", searchPattern!).limit(100)
                    : Promise.resolve({ data: [] as { id: string }[], error: null }),
                currentSearch
                    ? supabase.from("qualification_master").select("id").ilike("name", searchPattern!).limit(100)
                    : Promise.resolve({ data: [] as { id: string }[], error: null }),
                currentCategory
                    ? supabase.from("qualification_master").select("id").eq("category", currentCategory).limit(500)
                    : Promise.resolve({ data: [] as { id: string }[], error: null }),
            ]);
            categories = categories_cached;
            employees = employees_cached;
            qualificationMasters = masters_cached.map((m) => ({ id: m.id, name: m.name, category: m.category ?? null }));

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

            if (!hasMatches || !hasCategoryMatches) {
                pageResult = { data: [], error: null };
                summaryData = [];
            } else {
                let pq = basePageQuery();
                let sq = supabase
                    .from("employee_qualifications")
                    .select("expiry_date, employees!inner(id)")
                    .is("employees.deleted_at", null);

                if (currentCategory) {
                    pq = pq.in("qualification_id", categoryQualificationIds);
                    sq = sq.in("qualification_id", categoryQualificationIds);
                }
                if (currentSearch) {
                    sq = sq.or(searchConditions.join(","));
                    if (currentLevel !== "ok") pq = pq.or(searchConditions.join(","));
                }
                if (currentLevel === "danger") pq = pq.lt("expiry_date", today);
                if (currentLevel === "urgent") pq = pq.gte("expiry_date", today).lte("expiry_date", urgentLimit);
                if (currentLevel === "warning") pq = pq.gt("expiry_date", urgentLimit).lte("expiry_date", warningLimit);
                if (currentLevel === "info") pq = pq.gt("expiry_date", warningLimit).lte("expiry_date", infoLimit);
                if (currentLevel === "ok") {
                    pq = currentSearch && searchGroup
                        ? pq.or(`and(${searchGroup},expiry_date.is.null),and(${searchGroup},expiry_date.gt.${infoLimit})`)
                        : pq.or(`expiry_date.is.null,expiry_date.gt.${infoLimit}`);
                }

                const [pqResult, sqResult] = await Promise.all([pq, sq]);
                pageResult = pqResult as typeof pageResult;
                summaryData = (sqResult.data || []) as { expiry_date: string | null }[];
            }
        }

        const items = (pageResult.data || []) as QualificationRow[];
        qualifications = items.slice(0, PAGE_SIZE);
        hasNextPage = items.length > PAGE_SIZE;

        // noFilter: counts already set from getCachedQualificationCounts(); else branch uses summaryData
        if (summaryData.length > 0) {
            counts = summaryData.reduce<Record<AlertLevel, number>>((acc, row) => {
                const level = getAlertLevel(row.expiry_date);
                acc[level] += 1;
                return acc;
            }, { danger: 0, urgent: 0, warning: 0, info: 0, ok: 0 });
        }

        const licenseGroupResult = await licenseGroupPromise;
        licenseGroups = computeLicenseGroupRecord((licenseGroupResult.data ?? []) as LicenseGroupInput[]);
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
            hasNextPage={hasNextPage}
            employees={employees}
            qualificationMasters={qualificationMasters}
            licenseGroups={licenseGroups}
        />
    );
}
