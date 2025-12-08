import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const supabase = await createClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear impersonation cookie if present
    const cookieStore = await cookies()
    cookieStore.delete('impersonation_mode')

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: Request) {
    const supabase = await createClient()

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear impersonation cookie if present
    const cookieStore = await cookies()
    cookieStore.delete('impersonation_mode')

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
}
