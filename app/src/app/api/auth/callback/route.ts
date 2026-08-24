import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthNextPath } from "@/lib/auth-callback-utils";
import { getSupabaseEnv } from "@/lib/supabase-env";
import type { Database } from "@/types/supabase";

// パスワードリセット・招待メールのコールバック。
// サーバーサイドで PKCE 交換し、redirect レスポンスへ cookie を載せる。
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const safePath = getSafeAuthNextPath(searchParams.get("next"));

    if (!code) {
        return NextResponse.redirect(`${origin}/login?authError=callback`);
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
                },
            },
        },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Auth callback exchange failed:", error.message);
        return NextResponse.redirect(`${origin}/login?authError=callback`);
    }

    return response;
}

export async function POST(request: NextRequest) {
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
