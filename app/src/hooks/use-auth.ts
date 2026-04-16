"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser, UserRole } from "@/lib/auth-types";

interface AuthState {
    user: AuthUser;
    role: UserRole;
    linkedEmployeeId: string | null;
    isAdmin: boolean;
    isAdminOrHr: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchRoleAndLink(userId: string): Promise<{ role: UserRole; linkedEmployeeId: string | null }> {
    const { data, error } = await supabase
        .from("user_roles")
        .select("role, employee_id")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return {
        role: (data?.role as UserRole) ?? null,
        linkedEmployeeId: data?.employee_id ?? null,
    };
}

function buildAuthState(
    user: AuthUser,
    role: UserRole,
    linkedEmployeeId: string | null,
    loading: boolean,
    signOut: () => Promise<void>
): AuthState {
    return {
        user,
        role,
        linkedEmployeeId,
        isAdmin: role === "admin",
        isAdminOrHr: role === "admin" || role === "hr",
        loading,
        signOut,
    };
}

export function AuthProvider({
    initialUser,
    initialRole,
    initialLinkedEmployeeId,
    children,
}: {
    initialUser: AuthUser;
    initialRole: UserRole;
    initialLinkedEmployeeId: string | null;
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<AuthUser>(initialUser);
    const [role, setRole] = useState<UserRole>(initialRole);
    const [linkedEmployeeId, setLinkedEmployeeId] = useState<string | null>(initialLinkedEmployeeId);
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
                setLinkedEmployeeId(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const next = await fetchRoleAndLink(nextUser.id);
                setRole(next.role);
                setLinkedEmployeeId(next.linkedEmployeeId);
            } catch (error) {
                console.error("Failed to refresh auth role:", error);
                setRole(null);
                setLinkedEmployeeId(null);
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
        () => buildAuthState(user, role, linkedEmployeeId, loading, signOut),
        [linkedEmployeeId, loading, role, signOut, user]
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
