import { type NextRequest } from "next/server";
import { exchangeCodeAndRedirect, exchangeCodeFromPost } from "@/lib/auth-exchange-code";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const rawNext = searchParams.get("next") ?? "/auth/update-password";
    return exchangeCodeAndRedirect(request, rawNext);
}

export async function POST(request: NextRequest) {
    return exchangeCodeFromPost(request);
}
