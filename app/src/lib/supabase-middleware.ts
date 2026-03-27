import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseEnv } from './supabase-env';

export function createSupabaseMiddleware(request: NextRequest) {
    let response = NextResponse.next({ request });
    const { url, anonKey } = getSupabaseEnv();

    const supabase = createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    return { supabase, response };
}
