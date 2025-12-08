import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invalid Request</title>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .card {
                        background: white;
                        padding: 3rem;
                        border-radius: 1rem;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 600px;
                        text-align: center;
                    }
                    h1 { color: #e53e3e; margin-top: 0; }
                    p { color: #4a5568; line-height: 1.8; margin: 1rem 0; }
                    .btn {
                        display: inline-block;
                        margin-top: 1.5rem;
                        padding: 1rem 2rem;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 0.5rem;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>⚠️ Missing Token</h1>
                    <p>Impersonation requires a valid token parameter.</p>
                    <a href="/en/superadmin" class="btn">← Back to Dashboard</a>
                </div>
            </body>
            </html>
        `, {
            status: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    }

    try {
        const adminClient = createAdminClient()

        // 1. Validate and get token details
        const { data: tokenData, error: tokenError } = await adminClient
            .from('impersonation_tokens')
            .select('tenant_id, admin_id, expires_at, used_at')
            .eq('token', token)
            .single()

        if (tokenError || !tokenData) {
            throw new Error('Invalid or expired token')
        }

        // 2. Check if token is still valid
        if (tokenData.used_at) {
            throw new Error('Token already used')
        }

        if (new Date(tokenData.expires_at) < new Date()) {
            throw new Error('Token expired')
        }

        // 3. Mark token as used
        await adminClient
            .from('impersonation_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('token', token)

        // 4. Get tenant owner's user ID
        const { data: ownerProfile, error: ownerError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('tenant_id', tokenData.tenant_id)
            .eq('role', 'owner')
            .single()

        if (ownerError || !ownerProfile) {
            throw new Error('Tenant owner not found')
        }

        // 5. Create session for the owner using admin API
        const { data: sessionData, error: sessionError } = await adminClient.auth.admin.createSession({
            user_id: ownerProfile.id
        })

        if (sessionError || !sessionData.session) {
            console.error('[Impersonate] Session creation failed:', sessionError)
            throw new Error('Failed to create session')
        }

        // 6. Set the session cookies and redirect
        const cookieStore = await cookies()

        // Set access token
        cookieStore.set('sb-access-token', sessionData.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: sessionData.session.expires_in
        })

        // Set refresh token
        cookieStore.set('sb-refresh-token', sessionData.session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        // 7. Redirect to tenant dashboard
        return NextResponse.redirect(new URL('/en/admin/dashboard', request.url))

    } catch (error) {
        console.error('[Impersonate] Error:', error)

        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Impersonation Failed</title>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .card {
                        background: white;
                        padding: 3rem;
                        border-radius: 1rem;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 600px;
                        text-align: center;
                    }
                    h1 { color: #e53e3e; margin-top: 0; }
                    p { color: #4a5568; line-height: 1.8; margin: 1rem 0; }
                    .error { 
                        background: #fee; 
                        border: 1px solid #fcc;
                        padding: 1rem; 
                        border-radius: 0.5rem;
                        margin: 1rem 0;
                        font-family: monospace;
                        font-size: 0.875rem;
                    }
                    .btn {
                        display: inline-block;
                        margin-top: 1.5rem;
                        padding: 1rem 2rem;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 0.5rem;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>⚠️ Impersonation Failed</h1>
                    <p>Unable to create impersonation session.</p>
                    <div class="error">${error instanceof Error ? error.message : 'Unknown error'}</div>
                    <p style="font-size: 0.875rem; color: #718096;">This could be due to an invalid/expired token or a configuration issue.</p>
                    <a href="/en/superadmin" class="btn">← Back to Dashboard</a>
                </div>
            </body>
            </html>
        `, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    }
}
