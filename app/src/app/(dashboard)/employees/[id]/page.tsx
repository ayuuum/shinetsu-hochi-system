import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { EmployeeDetailClient, type EmployeeDetail, type EmployeeDetailTab } from "@/components/employees/employee-detail-client";
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

const VALID_TABS: EmployeeDetailTab[] = ["basic", "insurance", "it", "qualifications", "construction", "family", "health"];

export default async function EmployeeDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = await searchParams;
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        if (!auth.linkedEmployeeId || auth.linkedEmployeeId !== id) {
            redirect(auth.linkedEmployeeId ? `/employees/${auth.linkedEmployeeId}` : "/me");
        }
    }

    const supabase = await createSupabaseServer();
    let currentTab: EmployeeDetailTab = VALID_TABS.includes(tab as EmployeeDetailTab) ? (tab as EmployeeDetailTab) : "basic";
    if (auth.role === "technician" && currentTab === "insurance") {
        currentTab = "basic";
    }
    if ((auth.role !== "admin" && auth.role !== "hr") && currentTab === "it") {
        currentTab = "basic";
    }

    const isAdminOrHr = auth.role === "admin" || auth.role === "hr";

    const [employeeResult, constructionResult, healthResult, itResult] = await Promise.all([
        supabase
            .from("employees")
            .select(`
                id, name, name_kana, employee_number, branch, position, job_title,
                birth_date, gender, phone_number, email, address, blood_type,
                hire_date, termination_date, employment_type, notes,
                health_insurance_no, pension_no, emp_insurance_no, photo_url,
                deleted_at, created_at, updated_at,
                employee_qualifications(
                    id, employee_id, qualification_master_id, certificate_number,
                    acquired_date, expiry_date, status, certificate_url, notes,
                    deleted_at, created_at, updated_at,
                    qualification_master(id, name, category, has_expiry, renewal_rule)
                ),
                employee_family(
                    id, employee_id, name, relationship, birth_date,
                    phone_number, is_emergency_contact, notes, created_at
                ),
                employee_life_insurances(
                    id, employee_id, insurance_name, insurance_company, agency,
                    start_date, maturity_date, peak_date, notes, created_at
                ),
                employee_damage_insurances(
                    id, employee_id, insurance_name, insurance_company, agency,
                    insurance_type, renewal_date, coverage_details, notes, created_at
                )
            `)
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

    const employee: EmployeeDetail = {
        ...employeeRow,
        employee_qualifications: employeeRow.employee_qualifications ?? [],
        employee_family: employeeRow.employee_family ?? [],
        employee_life_insurances: employeeRow.employee_life_insurances ?? [],
        employee_damage_insurances: employeeRow.employee_damage_insurances ?? [],
        employee_it_accounts: itResult.data ?? [],
        construction_records: constructionResult.data || [],
        health_checks: healthResult.data || [],
    };

    // Collect all storage paths to fetch signed URLs in parallel
    const certPaths = employee.employee_qualifications
        .filter((q) => q.certificate_url)
        .map((q) => ({ id: q.id, path: q.certificate_url! }));

    const allPaths = [
        ...certPaths.map((c) => c.path),
        ...(employee.photo_url ? [employee.photo_url] : []),
    ];

    let certUrls: Record<string, string> = {};
    let photoUrl: string | null = null;

    if (allPaths.length > 0) {
        const { data: signedData } = await supabase.storage
            .from("certificates")
            .createSignedUrls(allPaths, 3600);

        if (signedData) {
            for (const entry of signedData) {
                if (!entry.signedUrl) continue;
                const certEntry = certPaths.find((c) => c.path === entry.path);
                if (certEntry) {
                    certUrls[certEntry.id] = entry.signedUrl;
                } else if (entry.path === employee.photo_url) {
                    photoUrl = entry.signedUrl;
                }
            }
        }
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
