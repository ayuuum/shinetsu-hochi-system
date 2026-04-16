import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

function safeNextPath(next: string | null): string {
    if (!next || !next.startsWith("/") || next.startsWith("//")) {
        return "/";
    }
    return next;
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = safeNextPath(url.searchParams.get("next"));

    if (code) {
        const supabase = await createSupabaseServer();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocal = process.env.NODE_ENV === "development";
            const origin = isLocal || !forwardedHost
                ? url.origin
                : `https://${forwardedHost}`;
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${url.origin}/login?authError=callback`);
}
