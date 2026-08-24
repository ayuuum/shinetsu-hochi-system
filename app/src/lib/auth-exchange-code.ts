import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthNextPath } from "@/lib/auth-callback-utils";
import { AUTH_RECOVERY_COOKIE, PASSWORD_RESET_NEXT_PATH } from "@/lib/auth-recovery";
import { getSupabaseEnv } from "@/lib/supabase-env";
import type { Database } from "@/types/supabase";

function attachRecoveryCookie(response: NextResponse, targetPath: string) {
    if (targetPath === PASSWORD_RESET_NEXT_PATH) {
        response.cookies.set(AUTH_RECOVERY_COOKIE, "1", {
            path: "/",
            maxAge: 60 * 30,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }
}

export async function exchangeCodeAndRedirect(
    request: NextRequest,
    nextPath: string,
    errorRedirectPath = "/login?authError=callback",
) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const safePath = getSafeAuthNextPath(nextPath);

    if (!code) {
        return NextResponse.redirect(`${origin}${errorRedirectPath}`);
    }

    const { url, anonKey } = getSupabaseEnv();
    let response = NextResponse.redirect(`${origin}${safePath}`);

    const supabase = createServerClient<Database>(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.redirect(`${origin}${safePath}`);
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                    attachRecoveryCookie(response, safePath);
                },
            },
        },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Auth callback exchange failed:", error.message);
        return NextResponse.redirect(`${origin}${errorRedirectPath}`);
    }

    attachRecoveryCookie(response, safePath);
    return response;
}

export async function exchangeCodeFromPost(request: NextRequest) {
    const { code } = (await request.json().catch(() => ({}))) as { code?: string };

    if (!code) {
        return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const { url, anonKey } = getSupabaseEnv();
    let response = NextResponse.json({ ok: true });

    const supabase = createServerClient<Database>(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.json({ ok: true });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.json({ error: "exchange_failed" }, { status: 400 });
    }

    return response;
}
