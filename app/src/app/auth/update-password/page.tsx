"use client";

import Link from "next/link";
import { Suspense, startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthPageLoading, AuthPageShell } from "@/components/auth-page-shell";
import { StatusBanner } from "@/components/shared/status-banner";
import { AUTH_RECOVERY_COOKIE } from "@/lib/auth-recovery";
import { supabase } from "@/lib/supabase";
import { getPasswordUpdateErrorMessage } from "@/lib/auth-error-messages";
import { Loader2 } from "lucide-react";

function clearRecoveryCookie() {
    document.cookie = `${AUTH_RECOVERY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function CallbackCodeRedirect() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            return;
        }

        const query = new URLSearchParams({ code });
        window.location.replace(`/api/auth/callback?${query.toString()}`);
    }, [searchParams]);

    return <AuthPageLoading className="h-40" />;
}

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

        // React 19: getSession が同期的に解決するとマウント前 setState 警告になるため、
        // 次フレームまでずらしてから状態を更新する。
        const frame = window.requestAnimationFrame(() => {
            void supabase.auth.getSession().then(({ data: { session } }) => {
                if (cancelled) {
                    return;
                }

                startTransition(() => {
                    setHasSession(Boolean(session));
                    setSessionChecked(true);
                });

                if (session) {
                    clearRecoveryCookie();
                }
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
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

        clearRecoveryCookie();
        setSuccess(true);
        toast.success("パスワードを更新しました");
        window.setTimeout(() => {
            router.push("/");
            router.refresh();
        }, 1500);
    }

    if (!sessionChecked) {
        return <AuthPageLoading className="h-40" />;
    }

    if (!hasSession) {
        return (
            <div className="space-y-4">
                <StatusBanner
                    variant="error"
                    title="再設定リンクが無効です"
                    description="ログイン画面の「パスワードを忘れた場合」から、再設定メールをもう一度送信してください。"
                />
                <Button render={<Link href="/login" />} className="w-full">
                    ログイン画面へ
                </Button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="space-y-4 py-2">
                <StatusBanner
                    variant="success"
                    title="パスワードを更新しました"
                    description="ダッシュボードへ移動しています…"
                />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    しばらくお待ちください
                </div>
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
                    placeholder="8文字以上…"
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
                    placeholder="もう一度入力…"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>
            {error && (
                <StatusBanner variant="error" title={error} />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                パスワードを更新
            </Button>
        </form>
    );
}

function UpdatePasswordGate() {
    const searchParams = useSearchParams();
    const hasCallbackCode = Boolean(searchParams.get("code"));

    if (hasCallbackCode) {
        return <CallbackCodeRedirect />;
    }

    return <UpdatePasswordForm />;
}

export default function UpdatePasswordPage() {
    return (
        <AuthPageShell
            subtitle="パスワードの再設定"
            title="新しいパスワードを設定"
            description="認証メールのリンクからアクセスして、新しいパスワードを設定してください。リンクの有効期限が切れている場合は、ログイン画面から再設定メールを再送してください。"
        >
            <Suspense fallback={<AuthPageLoading className="h-40" />}>
                <UpdatePasswordGate />
            </Suspense>
        </AuthPageShell>
    );
}
