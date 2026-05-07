import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

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
