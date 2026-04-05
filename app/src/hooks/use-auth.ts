"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser, UserRole } from "@/lib/auth-types";

interface AuthState {
    user: AuthUser;
    role: UserRole;
    isAdmin: boolean;
    isAdminOrHr: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data?.role as UserRole) ?? null;
}

function buildAuthState(user: AuthUser, role: UserRole, loading: boolean, signOut: () => Promise<void>): AuthState {
    return {
        user,
        role,
        isAdmin: role === "admin",
        isAdminOrHr: role === "admin" || role === "hr",
        loading,
        signOut,
    };
}

export function AuthProvider({
    initialUser,
    initialRole,
    children,
}: {
    initialUser: AuthUser;
    initialRole: UserRole;
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<AuthUser>(initialUser);
    const [role, setRole] = useState<UserRole>(initialRole);
    const [loading, setLoading] = useState(false);
    const userRef = useRef<AuthUser>(initialUser);
    const roleRef = useRef<UserRole>(initialRole);

    useEffect(() => {
        userRef.current = user;
        roleRef.current = role;
    }, [role, user]);

    useEffect(() => {
        let isActive = true;

        const refreshAuthState = async (nextUser: AuthUser) => {
            if (!isActive) return;

            setUser(nextUser);

            if (!nextUser) {
                setRole(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                setRole(await fetchRole(nextUser.id));
            } catch (error) {
                console.error("Failed to refresh auth role:", error);
                setRole(null);
            } finally {
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const nextUser: AuthUser = session?.user
                    ? { id: session.user.id, email: session.user.email ?? null }
                    : null;

                if (nextUser?.id === userRef.current?.id && roleRef.current !== null) {
                    setUser(nextUser);
                    return;
                }

                await refreshAuthState(nextUser);
            }
        );

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }, []);

    const value = useMemo(
        () => buildAuthState(user, role, loading, signOut),
        [loading, role, signOut, user]
    );

    return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider.");
    }

    return context;
}
