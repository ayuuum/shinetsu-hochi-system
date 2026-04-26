import { redirect } from "next/navigation";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function TodayPage() {
    const auth = await getFastAuthSnapshot();

    if (!auth.user) {
        redirect("/login");
    }

    if (auth.role !== "technician") {
        redirect("/dashboard");
    }

    if (!auth.linkedEmployeeId) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">今日の作業</h1>
                <p className="text-muted-foreground">
                    このアカウントに紐づく社員情報が設定されていません。管理者に連絡してください。
                </p>
            </div>
        );
    }

    const supabase = await createSupabaseServer();
    const { data: emp } = await supabase
        .from("employees")
        .select("name")
        .eq("id", auth.linkedEmployeeId)
        .single();

    return (
        <TechnicianDashboard
            employeeId={auth.linkedEmployeeId}
            employeeName={emp?.name ?? undefined}
        />
    );
}
