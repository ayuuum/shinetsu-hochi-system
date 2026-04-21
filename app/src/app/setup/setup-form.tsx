"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { setupAction } from "@/app/actions/setup-actions";

export default function SetupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const passwordStrength = (() => {
        if (password.length === 0) return null;
        if (password.length < 8) return { level: 1, label: "短すぎます", color: "bg-destructive" };
        if (password.length < 12) return { level: 2, label: "普通", color: "bg-chart-3" };
        return { level: 3, label: "強い", color: "bg-chart-2" };
    })();

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
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                    {/* メールアドレス */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-semibold tracking-tight">
                            メールアドレス
                            <span className="ml-1 text-xs font-normal text-muted-foreground">（ログインに使用）</span>
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@shinetsu-hochi.co.jp"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            spellCheck={false}
                        />
                    </div>

                    {/* パスワード */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold tracking-tight">
                            パスワード
                            <span className="ml-1 text-xs font-normal text-muted-foreground">（8文字以上）</span>
                        </label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="パスワードを設定"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {/* パスワード強度バー */}
                        {passwordStrength && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                i <= passwordStrength.level ? passwordStrength.color : "bg-muted"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-xs ${passwordStrength.level === 1 ? "text-destructive" : passwordStrength.level === 2 ? "text-chart-3" : "text-chart-2"}`}>
                                    強度: {passwordStrength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* パスワード確認 */}
                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-semibold tracking-tight">
                            パスワード（確認）
                        </label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirm ? "text" : "password"}
                                placeholder="もう一度入力"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowConfirm((v) => !v)}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {/* 一致インジケーター */}
                        {confirmPassword.length > 0 && (
                            <p className={`text-xs ${password === confirmPassword ? "text-chart-2" : "text-destructive"}`}>
                                {password === confirmPassword ? "✓ パスワードが一致しています" : "✗ パスワードが一致しません"}
                            </p>
                        )}
                    </div>

                    {/* エラー */}
                    {error && (
                        <p aria-live="polite" className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
                    )}

                    <Button type="submit" className="mt-1 w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        管理者アカウントを作成する
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
