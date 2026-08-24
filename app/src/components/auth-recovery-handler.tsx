"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function hasRecoveryHash() {
    if (typeof window === "undefined") {
        return false;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return hashParams.get("type") === "recovery" && Boolean(hashParams.get("access_token"));
}

export function AuthRecoveryHandler() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname === "/auth/update-password" || pathname.startsWith("/auth/callback")) {
            return;
        }

        if (!hasRecoveryHash()) {
            return;
        }

        const next = encodeURIComponent("/auth/update-password");
        window.location.replace(`/auth/callback?next=${next}${window.location.hash}`);
    }, [pathname]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event !== "PASSWORD_RECOVERY") {
                return;
            }

            if (window.location.pathname === "/auth/update-password") {
                return;
            }

            router.replace("/auth/update-password");
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return null;
}
