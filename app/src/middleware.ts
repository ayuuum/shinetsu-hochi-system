import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddleware } from '@/lib/supabase-middleware';

export async function middleware(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddleware(request);

    const { data: { session } } = await supabase.auth.getSession();

    const isLoginPage = request.nextUrl.pathname === '/login';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    // Allow API routes (they have their own auth)
    if (isApiRoute) {
        return response;
    }

    // Redirect unauthenticated users to login
    if (!session && !isLoginPage) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users away from login
    if (session && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
