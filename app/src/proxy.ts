import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddleware } from "@/lib/supabase-middleware";

function isPublicPath(pathname: string) {
    return (
        pathname === "/login"
        || pathname === "/setup"
        || pathname.startsWith("/auth/callback")
    );
}

export async function proxy(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddleware(request);

    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === "/login";
    const isApiRoute = pathname.startsWith("/api/");
    const publicPath = isPublicPath(pathname);

    if (isApiRoute) {
        return response;
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
        return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
