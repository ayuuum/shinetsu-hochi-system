"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setupAction } from "@/app/actions/setup-actions";

export default function SetupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError("メールアドレスを入力してください。");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("有効なメールアドレスを入力してください。");
            return;
        }
        if (!password) {
            setError("パスワードを入力してください。");
            return;
        }
        if (password.length < 8) {
            setError("パスワードは8文字以上で入力してください。");
            return;
        }
        if (password !== confirmPassword) {
            setError("パスワードが一致しません。");
            return;
        }

        setLoading(true);
        const result = await setupAction(trimmedEmail, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error ?? "セットアップに失敗しました。");
            return;
        }

        toast.success("管理者アカウントを作成しました。ログインしてください。");
        router.push("/login");
    }

    return (
        <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label htmlFor="email" className="mb-2.5 block text-sm font-semibold tracking-tight">メールアドレス</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="example@shinetsu-hochi.co.jp"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            name="email"
                            spellCheck={false}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2.5 block text-sm font-semibold tracking-tight">パスワード</label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="8文字以上"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            name="password"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="mb-2.5 block text-sm font-semibold tracking-tight">パスワード（確認）</label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="パスワードを再入力"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            name="confirm-password"
                        />
                    </div>
                    {error && (
                        <p aria-live="polite" className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
                    )}
                    <Button type="submit" className="mt-1 w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        セットアップを完了する
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
