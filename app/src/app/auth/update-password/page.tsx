"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/lib/supabase";
import { getPasswordUpdateErrorMessage } from "@/lib/auth-error-messages";
import { Loader2 } from "lucide-react";

function UpdatePasswordForm() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
        setLoading(false);

        if (updateError) {
            setError(getPasswordUpdateErrorMessage(updateError.message));
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">新しいパスワード</label>
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
            <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">新しいパスワード（確認）</label>
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
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <BrandLogo priority className="mx-auto w-[240px] max-w-full" />
                    <p className="text-sm text-muted-foreground">パスワードの再設定</p>
                </div>
                <Card className="shadow-xl border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">新しいパスワードを設定</CardTitle>
                        <CardDescription>
                            認証メールのリンクからアクセスして、新しいパスワードを設定してください。
                            リンクの有効期限が切れている場合は、ログイン画面から再設定メールを再送してください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense
                            fallback={(
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        >
                            <UpdatePasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
