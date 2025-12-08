import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return errorPage('Missing Token', 'Impersonation requires a valid token parameter.')
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

        // 5. Get owner's email from auth.users
        const { data: ownerUser, error: ownerUserError } = await adminClient.auth.admin.getUserById(ownerProfile.id)

        if (ownerUserError || !ownerUser.user?.email) {
            throw new Error('Owner email not found')
        }

        // 6. Generate magic link for auto-login
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: ownerUser.user.email,
            options: {
                redirectTo: `${origin}/en/admin/dashboard`
            }
        })

        if (linkError || !linkData.properties?.hashed_token) {
            console.error('[Impersonate] Link generation failed:', linkError)
            throw new Error('Failed to generate login link')
        }

        // 7. Redirect to auth confirm with the hashed token (auto-login)
        const confirmUrl = `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/en/admin/dashboard&impersonate=true`
        return NextResponse.redirect(confirmUrl)

    } catch (error) {
        console.error('[Impersonate] Error:', error)
        return errorPage(
            'Impersonation Failed',
            error instanceof Error ? error.message : 'Unknown error'
        )
    }
}

function errorPage(title: string, message: string) {
    return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
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
                h1 { color: #e53e3e; margin-top: 0; font-size: 2rem; }
                p { color: #4a5568; line-height: 1.8; margin: 1rem 0; }
                .error { 
                    background: #fee; 
                    border: 1px solid #fcc;
                    padding: 1rem; 
                    border-radius: 0.5rem;
                    margin: 1rem 0;
                    font-family: monospace;
                    font-size: 0.875rem;
                    color: #c00;
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
                <h1>⚠️ ${title}</h1>
                <div class="error">${message}</div>
                <p style="font-size: 0.875rem; color: #718096;">
                    This could be due to an invalid/expired token or a configuration issue.
                </p>
                <a href="/en/superadmin" class="btn">← Back to Dashboard</a>
            </div>
        </body>
        </html>
    `, {
        status: title === 'Missing Token' ? 400 : 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
}
