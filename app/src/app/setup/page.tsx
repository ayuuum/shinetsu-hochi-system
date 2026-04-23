import { redirect } from "next/navigation";
import { getAdminCount } from "@/app/actions/setup-actions";
import { BrandLogo } from "@/components/brand-logo";
import SetupForm from "./setup-form";
import { CheckCircle2 } from "lucide-react";

const steps = [
    { label: "管理者アカウント作成", active: true },
    { label: "ログイン" },
    { label: "ユーザー招待・運用開始" },
];

export default async function SetupPage() {
    const count = await getAdminCount();
    if (count > 0) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 gap-8">

            {/* ロゴ */}
            <div className="text-center space-y-2">
                <BrandLogo priority className="mx-auto w-[220px] max-w-full" />
                <p className="text-xs text-muted-foreground">社員・資格管理システム</p>
            </div>

            {/* メインカード */}
            <div className="w-full max-w-md space-y-6">

                {/* ヘッダー */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                        初回セットアップ
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">管理者アカウントを作成</h1>
                    <p className="text-sm text-muted-foreground">
                        このアカウントがシステム全体を管理します。<br />
                        安全なパスワードを設定してください。
                    </p>
                </div>

                {/* ステップインジケーター */}
                <div className="flex items-center gap-2">
                    {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                step.active
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                                {i + 1}
                            </div>
                            <span className={`text-xs truncate ${step.active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {step.label}
                            </span>
                            {i < steps.length - 1 && (
                                <div className="h-px flex-1 bg-border" />
                            )}
                        </div>
                    ))}
                </div>

                {/* フォーム */}
                <SetupForm />

                {/* 注意事項 */}
                <div className="rounded-[12px] border border-border bg-muted/40 p-4 space-y-2">
                    <p className="text-xs font-semibold text-foreground">セットアップ完了後にできること</p>
                    {[
                        "社員・資格・車両データの管理",
                        "/admin/users から他のユーザーを招待",
                        "ロール設定（管理者 / 人事 / 技術者）",
                    ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" />
                            <p className="text-xs text-muted-foreground">{item}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
