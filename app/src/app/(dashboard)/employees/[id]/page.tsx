import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { EmployeeDetailClient, type EmployeeDetail, type EmployeeDetailTab } from "@/components/employees/employee-detail-client";
import { getEmployeeDetailSelect } from "@/lib/employee-detail";
import { Tables } from "@/types/supabase";

type EmployeeQualification = Tables<"employee_qualifications"> & {
    qualification_master: Tables<"qualification_master"> | null;
};

type EmployeePageRow = Tables<"employees"> & {
    employee_qualifications: EmployeeQualification[] | null;
    employee_family: Tables<"employee_family">[] | null;
    employee_life_insurances: Tables<"employee_life_insurances">[] | null;
    employee_damage_insurances: Tables<"employee_damage_insurances">[] | null;
};

const VALID_TABS: EmployeeDetailTab[] = ["qualifications", "basic", "construction", "seminars", "health", "family", "it", "insurance"];

export default async function EmployeeDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = await searchParams;
    const auth = await getFastAuthSnapshot();
    if (auth.role === "technician") {
        if (!auth.linkedEmployeeId || auth.linkedEmployeeId !== id) {
            redirect(auth.linkedEmployeeId ? `/employees/${auth.linkedEmployeeId}` : "/me");
        }
    }

    const supabase = await createSupabaseServer();
    let currentTab: EmployeeDetailTab = VALID_TABS.includes(tab as EmployeeDetailTab) ? (tab as EmployeeDetailTab) : "qualifications";
    if (auth.role === "technician" && currentTab === "insurance") {
        currentTab = "basic";
    }
    if ((auth.role !== "admin" && auth.role !== "hr") && currentTab === "it") {
        currentTab = "basic";
    }

    const isAdminOrHr = auth.role === "admin" || auth.role === "hr";
    const [employeeResult, constructionResult, healthResult, itResult, examHistoryResult, seminarResult, deletedQualsResult] = await Promise.all([
        supabase
            .from("employees")
            .select(getEmployeeDetailSelect(currentTab))
            .eq("id", id)
            .is("deleted_at", null)
            .maybeSingle(),
        supabase
            .from("construction_records")
            .select("*")
            .eq("employee_id", id)
            .is("deleted_at", null)
            .order("construction_date", { ascending: false }),
        supabase
            .from("health_checks")
            .select("*")
            .eq("employee_id", id)
            .is("deleted_at", null)
            .order("check_date", { ascending: false }),
        isAdminOrHr
            ? supabase
                .from("employee_it_accounts")
                .select("*")
                .eq("employee_id", id)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true })
            : Promise.resolve({ data: [] as Tables<"employee_it_accounts">[], error: null }),
        supabase
            .from("qualification_exam_history")
            .select("*")
            .eq("employee_id", id)
            .order("exam_date", { ascending: false }),
        supabase
            .from("seminar_records")
            .select("*")
            .eq("employee_id", id)
            .order("held_date", { ascending: false }),
        supabase
            .from("employee_qualifications")
            .select("*, qualification_master(*)")
            .eq("employee_id", id)
            .not("deleted_at", "is", null)
            .order("deleted_at", { ascending: false }),
    ]);

    if (employeeResult.error) {
        console.error("Failed to load employee detail:", employeeResult.error);
        notFound();
    }

    const employeeRow = employeeResult.data as EmployeePageRow | null;

    if (!employeeRow) {
        notFound();
    }

    if (constructionResult.error) {
        console.error("Failed to load construction records:", constructionResult.error);
    }

    if (healthResult.error) {
        console.error("Failed to load health checks:", healthResult.error);
    }

    if (itResult.error) {
        console.error("Failed to load employee IT accounts:", itResult.error);
    }

    const allQuals = (employeeRow.employee_qualifications ?? []) as EmployeeQualification[];
    const activeQuals = allQuals.filter((q) => !q.deleted_at);

    const employee: EmployeeDetail = {
        ...employeeRow,
        employee_qualifications: activeQuals,
        employee_family: employeeRow.employee_family ?? [],
        employee_life_insurances: employeeRow.employee_life_insurances ?? [],
        employee_damage_insurances: employeeRow.employee_damage_insurances ?? [],
        employee_it_accounts: itResult.data ?? [],
        construction_records: constructionResult.data || [],
        health_checks: healthResult.data || [],
        exam_history: examHistoryResult.data || [],
        seminar_records: seminarResult.data || [],
        deleted_qualifications: (deletedQualsResult.data as EmployeeQualification[]) || [],
    };

    let certUrls: Record<string, string> = {};
    let photoUrl: string | null = null;

    {
        const certPaths = [...employee.employee_qualifications, ...employee.deleted_qualifications]
            .filter((qualification) => qualification.certificate_url)
            .map((qualification) => ({ id: qualification.id, path: qualification.certificate_url! }));

        if (certPaths.length > 0) {
            const { data: signedData } = await supabase.storage
                .from("certificates")
                .createSignedUrls(certPaths.map((entry) => entry.path), 3600);

            if (signedData) {
                for (const entry of signedData) {
                    if (!entry.signedUrl) continue;
                    const certEntry = certPaths.find((candidate) => candidate.path === entry.path);
                    if (certEntry) {
                        certUrls[certEntry.id] = entry.signedUrl;
                    }
                }
            }
        }
    }

    if (employee.photo_url) {
        const { data: signedPhoto } = await supabase.storage
            .from("certificates")
            .createSignedUrl(employee.photo_url, 3600);
        photoUrl = signedPhoto?.signedUrl || null;
    }

    return (
        <EmployeeDetailClient
            employee={employee}
            certUrls={certUrls}
            initialTab={currentTab}
            photoUrl={photoUrl}
        />
    );
}
