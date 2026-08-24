"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_RECOVERY_COOKIE, PASSWORD_RESET_NEXT_PATH } from "@/lib/auth-recovery";
import { supabase } from "@/lib/supabase";

function hasRecoveryHash() {
    if (typeof window === "undefined") {
        return false;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return hashParams.get("type") === "recovery" && Boolean(hashParams.get("access_token"));
}

function markRecoveryPending() {
    document.cookie = `${AUTH_RECOVERY_COOKIE}=1; Path=/; Max-Age=1800; SameSite=Lax`;
}

export function AuthRecoveryHandler() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname === PASSWORD_RESET_NEXT_PATH || pathname.startsWith("/auth/callback")) {
            return;
        }

        if (!hasRecoveryHash()) {
            return;
        }

        markRecoveryPending();
        const next = encodeURIComponent(PASSWORD_RESET_NEXT_PATH);
        window.location.replace(`/auth/callback?next=${next}${window.location.hash}`);
    }, [pathname]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event !== "PASSWORD_RECOVERY") {
                return;
            }

            if (window.location.pathname === PASSWORD_RESET_NEXT_PATH) {
                return;
            }

            markRecoveryPending();
            router.replace(PASSWORD_RESET_NEXT_PATH);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return null;
}
