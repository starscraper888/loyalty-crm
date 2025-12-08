import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/en/admin/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
        })

        if (!error) {
            // Redirect to the specified next URL
            return NextResponse.redirect(new URL(next, request.url))
        }

        // If there's an error, redirect to error page
        return NextResponse.redirect(new URL(`/en?error=${error.message}`, request.url))
    }

    // No token provided
    return NextResponse.redirect(new URL('/en?error=Invalid confirmation link', request.url))
}
