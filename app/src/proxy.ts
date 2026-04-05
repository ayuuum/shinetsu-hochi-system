import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddleware } from '@/lib/supabase-middleware';

export async function proxy(request: NextRequest) {
    const { supabase, response } = createSupabaseMiddleware(request);

    const { data: { session } } = await supabase.auth.getSession();

    const isLoginPage = request.nextUrl.pathname === '/login';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    if (isApiRoute) {
        return response;
    }

    if (!session && !isLoginPage) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

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
