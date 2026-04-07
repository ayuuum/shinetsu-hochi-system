import { NextResponse } from "next/server";
import { ensureDevTestUser } from "@/lib/ensure-dev-test-user";

/**
 * 開発時のみ: test@gmail.com / test 用ユーザーを Auth + user_roles に用意する。
 * 本番ビルドでは常に 404（ルート自体は存在しても呼び出し側が dev のみ）。
 */
export async function POST() {
    const result = await ensureDevTestUser();
    if (!result.ok) {
        if (result.reason === "forbidden") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (result.reason === "no_service_role") {
            return NextResponse.json(
                { error: "SUPABASE_SERVICE_ROLE_KEY が未設定です。.env.local を確認してください。" },
                { status: 503 },
            );
        }
        return NextResponse.json({ error: result.reason }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
}
