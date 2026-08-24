"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLoading, AuthPageShell } from "@/components/auth-page-shell";
import { supabase } from "@/lib/supabase";
import { getPasswordUpdateErrorMessage } from "@/lib/auth-error-messages";
import { CheckCircle2, Loader2 } from "lucide-react";

function UpdatePasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (cancelled) {
                return;
            }
            setHasSession(Boolean(session));
            setSessionChecked(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("パスワードは8文字以上にしてください。");
            return;
        }

        if (password !== confirm) {
            setError("パスワードが一致しません。");
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setLoading(false);
            setError(getPasswordUpdateErrorMessage(updateError.message));
            return;
        }

        setSuccess(true);
        toast.success("パスワードを更新しました");
        setTimeout(() => {
            router.push("/");
            router.refresh();
        }, 1500);
    }

    if (!sessionChecked) {
        return <AuthPageLoading className="h-40" />;
    }

    if (!hasSession) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    再設定リンクの有効期限が切れているか、正しいリンクからアクセスしていません。
                </p>
                <p className="text-sm text-muted-foreground">
                    ログイン画面の「パスワードを忘れた場合」から、再設定メールをもう一度送信してください。
                </p>
                <Button render={<Link href="/login" />} className="w-full">
                    ログイン画面へ
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-base font-semibold">パスワードを更新しました</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ダッシュボードへ移動しています...
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <label htmlFor="new-password" className="mb-2.5 block text-sm font-semibold tracking-tight">
                    新しいパスワード
                </label>
                <Input
                    id="new-password"
                    type="password"
                    placeholder="8文字以上"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    autoFocus
                />
            </div>
            <div>
                <label htmlFor="confirm-password" className="mb-2.5 block text-sm font-semibold tracking-tight">
                    新しいパスワード（確認）
                </label>
                <Input
                    id="confirm-password"
                    type="password"
                    placeholder="もう一度入力"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>
            {error && (
                <p aria-live="polite" className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                パスワードを更新
            </Button>
        </form>
    );
}

export default function UpdatePasswordPage() {
    return (
        <AuthPageShell
            subtitle="パスワードの再設定"
            title="新しいパスワードを設定"
            description="認証メールのリンクからアクセスして、新しいパスワードを設定してください。リンクの有効期限が切れている場合は、ログイン画面から再設定メールを再送してください。"
        >
            <Suspense fallback={<AuthPageLoading className="h-40" />}>
                <UpdatePasswordForm />
            </Suspense>
        </AuthPageShell>
    );
}
