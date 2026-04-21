import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { EmployeeDetailClient, type EmployeeDetail, type EmployeeDetailTab } from "@/components/employees/employee-detail-client";
import { Tables } from "@/types/supabase";
import {
    getEmployeeDetailSelect,
    shouldLoadConstructionRecords,
    shouldLoadEmployeeItAccounts,
    shouldLoadHealthChecks,
    shouldLoadQualificationCertificateUrls,
} from "@/lib/employee-detail";

type EmployeeQualification = Tables<"employee_qualifications"> & {
    qualification_master: Tables<"qualification_master"> | null;
};

type EmployeePageRow = Tables<"employees"> & {
    employee_qualifications?: EmployeeQualification[] | null;
    employee_family?: Tables<"employee_family">[] | null;
    employee_life_insurances?: Tables<"employee_life_insurances">[] | null;
    employee_damage_insurances?: Tables<"employee_damage_insurances">[] | null;
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

    const employeeResult = await supabase
        .from("employees")
        .select(getEmployeeDetailSelect(currentTab))
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();

    if (employeeResult.error) {
        console.error("Failed to load employee detail:", employeeResult.error);
        notFound();
    }

    const employeeRow = employeeResult.data as EmployeePageRow | null;

    if (!employeeRow) {
        notFound();
    }

    let employee_it_accounts: Tables<"employee_it_accounts">[] = [];
    let construction_records: Tables<"construction_records">[] = [];
    let health_checks: Tables<"health_checks">[] = [];

    if (shouldLoadEmployeeItAccounts(currentTab, auth.role === "admin" || auth.role === "hr")) {
        const itResult = await supabase
            .from("employee_it_accounts")
            .select("*")
            .eq("employee_id", id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });
        if (itResult.error) {
            console.error("Failed to load employee IT accounts:", itResult.error);
        } else {
            employee_it_accounts = itResult.data ?? [];
        }
    }

    if (shouldLoadConstructionRecords(currentTab)) {
        const constructionResult = await supabase
            .from("construction_records")
            .select("*")
            .eq("employee_id", id)
            .is("deleted_at", null)
            .order("construction_date", { ascending: false });

        if (constructionResult.error) {
            console.error("Failed to load construction records:", constructionResult.error);
        } else {
            construction_records = constructionResult.data ?? [];
        }
    }

    if (shouldLoadHealthChecks(currentTab)) {
        const healthResult = await supabase
            .from("health_checks")
            .select("*")
            .eq("employee_id", id)
            .is("deleted_at", null)
            .order("check_date", { ascending: false });

        if (healthResult.error) {
            console.error("Failed to load health checks:", healthResult.error);
        } else {
            health_checks = healthResult.data ?? [];
        }
    }

    const employee: EmployeeDetail = {
        ...employeeRow,
        employee_qualifications: employeeRow.employee_qualifications ?? [],
        employee_family: employeeRow.employee_family ?? [],
        employee_life_insurances: employeeRow.employee_life_insurances ?? [],
        employee_damage_insurances: employeeRow.employee_damage_insurances ?? [],
        employee_it_accounts,
        construction_records,
        health_checks,
    };

    const certificateEntries = shouldLoadQualificationCertificateUrls(currentTab)
        ? await Promise.all(
            employee.employee_qualifications
                .filter((qualification) => qualification.certificate_url)
                .map(async (qualification) => {
                    try {
                        const { data, error } = await supabase.storage
                            .from("certificates")
                            .createSignedUrl(qualification.certificate_url!, 3600);

                        if (error || !data?.signedUrl) {
                            if (error) {
                                console.error(`Failed to create signed URL for qualification ${qualification.id}:`, error);
                            }
                            return null;
                        }

                        return [qualification.id, data.signedUrl] as const;
                    } catch (error) {
                        console.error(`Failed to fetch certificate URL for qualification ${qualification.id}:`, error);
                        return null;
                    }
                })
        )
        : [];

    let photoUrl: string | null = null;
    if (employee.photo_url) {
        const { data } = await supabase.storage
            .from("certificates")
            .createSignedUrl(employee.photo_url, 3600);
        photoUrl = data?.signedUrl || null;
    }

    return (
        <EmployeeDetailClient
            employee={employee}
            certUrls={Object.fromEntries(certificateEntries.filter((entry): entry is readonly [string, string] => entry !== null))}
            initialTab={currentTab}
            photoUrl={photoUrl}
        />
    );
}
