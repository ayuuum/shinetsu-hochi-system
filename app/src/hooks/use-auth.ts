"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type UserRole = "admin" | "hr" | "technician" | null;

interface AuthState {
    user: User | null;
    role: UserRole;
    isAdmin: boolean;
    isAdminOrHr: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

async function fetchRole(userId: string): Promise<UserRole> {
    const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", userId)
        .single();
    return (data?.role as UserRole) ?? null;
}

export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                setRole(await fetchRole(currentUser.id));
            }

            setLoading(false);
        };

        fetchAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    setRole(await fetchRole(currentUser.id));
                } else {
                    setRole(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return {
        user,
        role,
        isAdmin: role === "admin",
        isAdminOrHr: role === "admin" || role === "hr",
        loading,
        signOut,
    };
}
