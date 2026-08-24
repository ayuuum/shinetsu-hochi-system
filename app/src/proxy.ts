import { NextRequest, NextResponse } from "next/server";
import { AUTH_RECOVERY_COOKIE, PASSWORD_RESET_NEXT_PATH } from "@/lib/auth-recovery";
import { createSupabaseMiddleware } from "@/lib/supabase-middleware";

function isPublicPath(pathname: string) {
    return (
        pathname === "/login"
        || pathname === "/setup"
        || pathname === "/manual"
        || pathname.startsWith("/auth/callback")
        || pathname === PASSWORD_RESET_NEXT_PATH
    );
}

function hasRecoveryCookie(request: NextRequest) {
    return request.cookies.get(AUTH_RECOVERY_COOKIE)?.value === "1";
}

function recoveryRedirect(request: NextRequest) {
    return NextResponse.redirect(new URL(PASSWORD_RESET_NEXT_PATH, request.url));
}

export async function proxy(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddleware(request);

    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === "/login";
    const isApiRoute = pathname.startsWith("/api/");
    const publicPath = isPublicPath(pathname);
    const pendingRecovery = hasRecoveryCookie(request);

    if (isApiRoute) {
        return response;
    }

    if (pendingRecovery && pathname !== PASSWORD_RESET_NEXT_PATH && !pathname.startsWith("/auth/callback")) {
        return recoveryRedirect(request);
    }

    if (publicPath && !isLoginPage) {
        return response;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session && !publicPath && !isLoginPage) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    if (session && isLoginPage) {
        if (pendingRecovery) {
            return recoveryRedirect(request);
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
