import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/en/admin/dashboard'
    const isImpersonation = searchParams.get('impersonate') === 'true'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })

        if (!error) {
            // If impersonation, set a cookie to track it
            const response = NextResponse.redirect(new URL(next, request.url))

            if (isImpersonation) {
                response.cookies.set('impersonation_mode', 'true', {
                    path: '/',
                    httpOnly: false, // Need client-side access
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 // 24 hours
                })
            }

            return response
        }

        // If there's an error, redirect to error page
        return NextResponse.redirect(new URL(`/en?error=${error.message}`, request.url))
    }

    // No token provided
    return NextResponse.redirect(new URL('/en?error=Invalid confirmation link', request.url))
}
