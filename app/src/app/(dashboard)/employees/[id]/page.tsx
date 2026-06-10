import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { EmployeeDetailClient, type EmployeeDetail, type EmployeeDetailTab } from "@/components/employees/employee-detail-client";
import {
    getEmployeeDetailSelect,
    shouldLoadConstructionRecords,
    shouldLoadDeletedQualifications,
    shouldLoadEmployeeItAccounts,
    shouldLoadEmployeePhoto,
    shouldLoadExamHistory,
    shouldLoadHealthChecks,
    shouldLoadQualificationCertificateUrls,
    shouldLoadSeminarRecords,
} from "@/lib/employee-detail";
import { Tables } from "@/types/supabase";

function AccessDeniedView() {
    return (
        <div className="space-y-5 animate-in fade-in duration-200">
            <Button variant="ghost" size="sm" className="w-fit rounded-full px-2.5 text-muted-foreground" render={<Link href="/employees" />}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                社員一覧へ戻る
            </Button>
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <Lock className="h-10 w-10 text-muted-foreground/50" />
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight">この社員情報は閲覧できません</h1>
                    <p className="text-sm text-muted-foreground">
                        この情報を閲覧するには管理者または人事担当者の権限が必要です。
                    </p>
                </div>
            </div>
        </div>
    );
}

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

    const isAdminOrHr = auth.role === "admin" || auth.role === "hr";
    // 健康診断・家族・血圧などの機微情報は、管理者/人事、または本人のみ閲覧可
    const canViewSensitive = isAdminOrHr || (auth.role === "technician" && auth.linkedEmployeeId === id);

    // サービスロールで全員の社員情報を取得する（RLS は本人/管理者のみ許可のため）。
    // サービスロールキーが未設定の場合はユーザーJWTクライアントにフォールバックし、
    // RLS でブロックされた場合は 404 ではなく「閲覧権限なし」ページを返す。
    const adminClient = createSupabaseAdmin();
    const supabase = adminClient ?? await createSupabaseServer();
    const usingServiceRole = !!adminClient;
    let currentTab: EmployeeDetailTab = VALID_TABS.includes(tab as EmployeeDetailTab) ? (tab as EmployeeDetailTab) : "qualifications";
    // 保険情報は admin のみ（クライアント表示と一致させ、URL直叩きでも他ロールに渡さない）
    if (auth.role !== "admin" && currentTab === "insurance") {
        currentTab = "basic";
    }
    // 健康診断・家族・IT は管理者/人事、または本人のみ（他人を閲覧する一般アカウントはタブを開けない／URL直叩き対策）
    if (!canViewSensitive && (currentTab === "health" || currentTab === "family" || currentTab === "it")) {
        currentTab = "basic";
    }
    const loadStart = process.hrtime.bigint();
    const [employeeResult, constructionResult, healthResult, itResult, examHistoryResult, seminarResult, deletedQualsResult] = await Promise.all([
        supabase
            .from("employees")
            .select(getEmployeeDetailSelect(currentTab, canViewSensitive))
            .eq("id", id)
            .is("deleted_at", null)
            .maybeSingle(),
        shouldLoadConstructionRecords(currentTab)
            ? supabase
                .from("construction_records")
                .select("*")
                .eq("employee_id", id)
                .is("deleted_at", null)
                .order("construction_date", { ascending: false })
            : Promise.resolve({ data: [] as Tables<"construction_records">[], error: null }),
        shouldLoadHealthChecks(currentTab) || canViewSensitive
            ? supabase
                .from("health_checks")
                .select("*")
                .eq("employee_id", id)
                .is("deleted_at", null)
                .order("check_date", { ascending: false })
            : Promise.resolve({ data: [] as Tables<"health_checks">[], error: null }),
        shouldLoadEmployeeItAccounts(currentTab, canViewSensitive)
            ? supabase
                .from("employee_it_accounts")
                .select("*")
                .eq("employee_id", id)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true })
            : Promise.resolve({ data: [] as Tables<"employee_it_accounts">[], error: null }),
        shouldLoadExamHistory(currentTab)
            ? supabase
                .from("qualification_exam_history")
                .select("*")
                .eq("employee_id", id)
                .order("exam_date", { ascending: false })
            : Promise.resolve({ data: [] as Tables<"qualification_exam_history">[], error: null }),
        shouldLoadSeminarRecords(currentTab)
            ? supabase
                .from("seminar_records")
                .select("*")
                .eq("employee_id", id)
                .order("held_date", { ascending: false })
            : Promise.resolve({ data: [] as Tables<"seminar_records">[], error: null }),
        shouldLoadDeletedQualifications(currentTab)
            ? supabase
                .from("employee_qualifications")
                .select("*, qualification_master(*)")
                .eq("employee_id", id)
                .not("deleted_at", "is", null)
                .order("deleted_at", { ascending: false })
            : Promise.resolve({ data: [] as EmployeeQualification[], error: null }),
    ]);
    const dataLoadMs = Number((process.hrtime.bigint() - loadStart) / BigInt(1_000_000));

    if (employeeResult.error) {
        console.error("Failed to load employee detail:", employeeResult.error);
        if (!usingServiceRole && !isAdminOrHr) {
            return <AccessDeniedView />;
        }
        notFound();
    }

    const employeeRow = employeeResult.data as EmployeePageRow | null;

    if (!employeeRow) {
        // サービスロールが利用できず RLS にブロックされた場合は権限エラーとして表示
        if (!usingServiceRole && !isAdminOrHr) {
            return <AccessDeniedView />;
        }
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

    const certUrls: Record<string, string> = {};
    let photoUrl: string | null = null;

    if (shouldLoadQualificationCertificateUrls(currentTab)) {
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

    if (shouldLoadEmployeePhoto(currentTab) && employee.photo_url) {
        const { data: signedPhoto } = await supabase.storage
            .from("certificates")
            .createSignedUrl(employee.photo_url, 3600);
        photoUrl = signedPhoto?.signedUrl || null;
    }

    if (process.env.NODE_ENV === "development") {
        console.info("[employee-detail]", {
            employeeId: id,
            tab: currentTab,
            dataLoadMs,
            certSignedUrlCount: Object.keys(certUrls).length,
            photoSignedUrl: !!photoUrl,
        });
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
