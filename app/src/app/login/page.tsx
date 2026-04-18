"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function getLoginErrorMessage(message: string) {
    const normalized = message.toLowerCase();

    if (
        normalized.includes("fetch")
        || normalized.includes("network")
        || normalized.includes("invalid url")
        || normalized.includes("failed to construct")
    ) {
        return "認証サーバーに接続できません。時間をおいて再試行してください。";
    }

    return "メールアドレスまたはパスワードが正しくありません。";
}

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState("");
    const [resetError, setResetError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const authError = searchParams.get("authError");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const trimmedEmail = email.trim().toLowerCase();
        if (
            process.env.NODE_ENV === "development"
            && trimmedEmail === "test@gmail.com"
            && password === "test"
        ) {
            try {
                const res = await fetch("/api/auth/ensure-dev-test-user", { method: "POST" });
                if (!res.ok) {
                    const body = (await res.json().catch(() => null)) as { error?: string } | null;
                    const msg = body?.error ?? `HTTP ${res.status}`;
                    console.warn("ensure-dev-test-user:", msg);
                    if (res.status === 503) {
                        setError(
                            msg
                            || "テスト用アカウントの準備に失敗しました。.env.local に SUPABASE_SERVICE_ROLE_KEY を設定するか、cd app && npm run auth:ensure-test を実行してください。",
                        );
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.warn("ensure-dev-test-user fetch failed:", e);
            }
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail || email.trim(),
            password,
        });

        setLoading(false);

        if (error) {
            console.error("Login failed:", error);
            setError(getLoginErrorMessage(error.message));
        } else {
            const redirectTo = searchParams.get("redirectTo") || "/";
            router.push(redirectTo);
            router.refresh();
        }
    }

    async function handlePasswordReset(e: React.FormEvent) {
        e.preventDefault();
        setResetError("");
        setResetMessage("");
        const trimmed = resetEmail.trim().toLowerCase();
        if (!trimmed) {
            setResetError("メールアドレスを入力してください。");
            return;
        }

        setResetLoading(true);
        const origin = window.location.origin;
        const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
            redirectTo,
        });
        setResetLoading(false);

        if (resetErr) {
            setResetError(
                resetErr.message.includes("rate")
                    ? "しばらく時間をおいてから再度お試しください。"
                    : "送信に失敗しました。メールアドレスをご確認ください。",
            );
            return;
        }

        setResetMessage(
            "パスワード再設定用のメールを送信しました。届いたリンクから手続きを完了してください。",
        );
    }

    return (
        <>
        <form onSubmit={handleLogin} className="space-y-4">
            {authError === "callback" && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    認証リンクの処理に失敗しました。リンクの有効期限が切れている可能性があります。再度「パスワードを忘れた場合」からお試しください。
                </p>
            )}
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
                <Input
                    id="email"
                    type="email"
                    placeholder="example@shinetsu-hochi.co.jp…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    name="email"
                    spellCheck={false}
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">パスワード</label>
                <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力…"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    name="password"
                />
            </div>
            {error && (
                <p aria-live="polite" className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ログイン
            </Button>
            <p className="text-center text-sm">
                <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                        setResetOpen(true);
                        setResetEmail(email.trim());
                        setResetError("");
                        setResetMessage("");
                    }}
                >
                    パスワードを忘れた場合
                </button>
            </p>
        </form>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>パスワードの再設定</DialogTitle>
                    <DialogDescription>
                        登録済みのメールアドレスに、再設定用のリンクを送信します。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="reset-email" className="text-sm font-medium">メールアドレス</label>
                        <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="example@shinetsu-hochi.co.jp"
                            required
                            autoComplete="email"
                        />
                    </div>
                    {resetError && (
                        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{resetError}</p>
                    )}
                    {resetMessage && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{resetMessage}</p>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                            閉じる
                        </Button>
                        <Button type="submit" disabled={resetLoading}>
                            {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            送信する
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <h1 className="sr-only">株式会社信越報知 社員・資格管理システム</h1>
                    <BrandLogo priority className="mx-auto w-[240px] max-w-full" />
                    <p className="text-sm text-muted-foreground">社員・資格管理システム</p>
                </div>
                <Card className="shadow-xl border-0">
                    <CardContent className="pt-6">
                        <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                            <LoginForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
