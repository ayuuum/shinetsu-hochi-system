import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { QualificationMastersClient } from "@/components/qualifications/qualification-masters-client";
import type { Tables } from "@/types/supabase";

export default async function QualificationMastersPage() {
    const auth = await getFastAuthSnapshot();
    if (!auth.user || (auth.role !== "admin" && auth.role !== "hr")) {
        redirect(auth.role === "technician" ? "/me" : "/qualifications");
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("qualification_master")
        .select("*")
        .order("category", { ascending: true, nullsFirst: false })
        .order("name");

    let masters: Tables<"qualification_master">[] = [];
    if (!error && data) {
        masters = data;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">資格マスタ</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    社員に付与する資格の種類を管理します（管理者・人事のみ）。
                </p>
            </div>
            <QualificationMastersClient masters={masters} />
        </div>
    );
}
