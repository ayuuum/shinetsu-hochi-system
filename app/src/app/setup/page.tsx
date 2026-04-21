import { redirect } from "next/navigation";
import { getAdminCount } from "@/app/actions/setup-actions";
import { BrandLogo } from "@/components/brand-logo";
import SetupForm from "./setup-form";

export default async function SetupPage() {
    const count = await getAdminCount();
    if (count > 0) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <h1 className="sr-only">株式会社信越報知 社員・資格管理システム</h1>
                    <BrandLogo priority className="mx-auto w-[240px] max-w-full" />
                    <p className="text-sm font-semibold tracking-tight">初回セットアップ</p>
                    <p className="text-sm text-muted-foreground">管理者アカウントを作成してください</p>
                </div>
                <SetupForm />
            </div>
        </div>
    );
}
