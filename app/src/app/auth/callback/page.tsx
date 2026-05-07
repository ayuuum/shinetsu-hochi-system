"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

function getSafeNextPath(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    return value;
}

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("認証リンクを確認しています...");
    const nextPath = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);

    useEffect(() => {
        let cancelled = false;

        async function completeAuthCallback() {
            const code = searchParams.get("code");

            if (code) {
                const response = await fetch("/api/auth/callback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    throw new Error("code_exchange_failed");
                }
            } else {
                const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");

                if (!accessToken || !refreshToken) {
                    throw new Error("missing_callback_tokens");
                }

                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (error) {
                    throw error;
                }
            }

            if (cancelled) {
                return;
            }

            router.replace(nextPath);
            router.refresh();
        }

        completeAuthCallback().catch((error) => {
            console.error("Auth callback failed:", error);

            if (cancelled) {
                return;
            }

            setMessage("認証リンクの処理に失敗しました。ログイン画面に戻ります...");
            router.replace("/login?authError=callback");
        });

        return () => {
            cancelled = true;
        };
    }, [nextPath, router, searchParams]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={(
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">認証リンクを確認しています...</p>
                </div>
            </main>
        )}>
            <CallbackContent />
        </Suspense>
    );
}
