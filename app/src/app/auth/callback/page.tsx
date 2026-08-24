"use client";

import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPageLoading, AuthPageShell } from "@/components/auth-page-shell";
import { supabase } from "@/lib/supabase";
import { getSafeAuthNextPath } from "@/lib/auth-callback-utils";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("認証リンクを確認しています...");
    const nextPath = useMemo(() => getSafeAuthNextPath(searchParams.get("next")), [searchParams]);

    useEffect(() => {
        let cancelled = false;

        async function completeAuthCallback() {
            const code = searchParams.get("code");

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
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

            startTransition(() => {
                router.replace(nextPath);
                router.refresh();
            });
        }

        const frame = window.requestAnimationFrame(() => {
            completeAuthCallback().catch((error) => {
                console.error("Auth callback failed:", error);

                if (cancelled) {
                    return;
                }

                startTransition(() => {
                    setMessage("認証リンクの処理に失敗しました。ログイン画面に戻ります...");
                    router.replace("/login?authError=callback");
                });
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
        };
    }, [nextPath, router, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <AuthPageLoading className="h-10" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <AuthPageShell subtitle="認証を確認しています">
            <Suspense fallback={<AuthPageLoading className="h-24" />}>
                <CallbackContent />
            </Suspense>
        </AuthPageShell>
    );
}
