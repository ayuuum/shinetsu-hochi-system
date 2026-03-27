"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
    const router = useRouter();
    const searchParams = useSearchParams();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
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

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
                <Input
                    id="email"
                    type="email"
                    placeholder="example@shinetsu-hochi.co.jp"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">パスワード</label>
                <Input
                    id="password"
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ログイン
            </Button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
                        信
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mt-4">信越報知</h1>
                    <p className="text-sm text-muted-foreground">社員・資格管理システム</p>
                </div>
                <Card className="shadow-xl border-0">
                    <CardContent className="pt-6">
                        <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
                            <LoginForm />
                        </Suspense>
                    </CardContent>
                </Card>
                <p className="text-center text-xs text-muted-foreground">
                    &copy; 信越報知機器株式会社
                </p>
            </div>
        </div>
    );
}
