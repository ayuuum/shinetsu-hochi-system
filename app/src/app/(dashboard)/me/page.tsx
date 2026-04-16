import { redirect } from "next/navigation";
import { getAuthSnapshot } from "@/lib/auth-server";

export default async function MePage() {
    const auth = await getAuthSnapshot();

    if (!auth.user) {
        redirect("/login");
    }

    if (auth.role === "technician" && auth.linkedEmployeeId) {
        redirect(`/employees/${auth.linkedEmployeeId}`);
    }

    if (auth.role === "technician") {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold tracking-tight">マイプロフィール</h1>
                <p className="text-muted-foreground">
                    ログインアカウントと社員マスタの紐づけ（user_roles.employee_id）が設定されていません。管理者に連絡してください。
                </p>
            </div>
        );
    }

    redirect("/");
}
