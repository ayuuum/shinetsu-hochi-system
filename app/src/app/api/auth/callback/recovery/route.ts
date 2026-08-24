import { type NextRequest } from "next/server";
import { exchangeCodeAndRedirect } from "@/lib/auth-exchange-code";

// パスワード再設定メール専用。next クエリに依存せず常に /auth/update-password へ送る。
export async function GET(request: NextRequest) {
    return exchangeCodeAndRedirect(request, "/auth/update-password");
}
