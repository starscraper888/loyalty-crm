import { NextResponse } from 'next/server'
import { validateImpersonationToken } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Validate token
    const result = await validateImpersonationToken(token)

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Generate a magic link/session for the target user
    const adminClient = createAdminClient()

    // Generate a one-time login link for the user
    const { data: magicLinkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: '', // We'll use user ID directly
        options: {
            redirectTo: `${request.headers.get('origin')}/en/admin/dashboard`
        }
    })

    if (linkError) {
        // Fallback: Try to get user and create error message
        console.error('[Impersonate] Error generating magic link:', linkError)

        return new NextResponse(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Impersonation Not Available</title>
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
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 500px;
                        text-align: center;
                    }
                    h1 { color: #e53e3e; margin-top: 0; }
                    p { color: #4a5568; line-height: 1.6; }
                    .btn {
                        display: inline-block;
                        margin-top: 1rem;
                        padding: 0.75rem 1.5rem;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 0.5rem;
                        font-weight: 600;
                    }
                    .btn:hover { background: #5a67d8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>⚠️ Impersonation Not Available</h1>
                    <p>The impersonation feature requires additional Supabase configuration. This is a secure feature that allows platform admins to login as tenants for support purposes.</p>
                    <p><strong>Coming Soon:</strong> We're working on implementing this securely using Supabase Auth tokens.</p>
                    <p style="font-size: 0.875rem; color: #718096; margin-top: 1.5rem;">Error: ${linkError.message}</p>
                    <a href="/en/superadmin" class="btn">← Back to Dashboard</a>
                </div>
            </body>
            </html>
        `, {
            status: 501,
            headers: {
                'Content-Type': 'text/html',
            }
        })
    }

    // If we got a magic link, redirect to it
    // The user will be automatically logged in
    if (magicLinkData?.properties?.hashed_token) {
        // Create the verification URL
        const verifyUrl = `${request.headers.get('origin')}/auth/confirm?token_hash=${magicLinkData.properties.hashed_token}&type=magiclink&next=/en/admin/dashboard`

        return NextResponse.redirect(verifyUrl)
    }

    // Fallback error
    return NextResponse.json({
        error: 'Failed to create impersonation session'
    }, { status: 500 })
}
