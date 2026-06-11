import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// パスワードリセット・招待メールのコールバック。
// サーバーサイドで PKCE 交換することで Gmail の先読みスキャンによるコード消費を防ぐ。
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/";
    const safePath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    if (!code) {
        return NextResponse.redirect(`${origin}/login?authError=callback`);
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("Auth callback exchange failed:", error.message);
        return NextResponse.redirect(`${origin}/login?authError=callback`);
    }

    return NextResponse.redirect(`${origin}${safePath}`);
}

export async function POST(request: NextRequest) {
    const { code } = (await request.json().catch(() => ({}))) as { code?: string };

    if (!code) {
        return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.json({ error: "exchange_failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
