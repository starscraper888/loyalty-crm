import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    // Simple test response to verify route works
    return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impersonation Feature</title>
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
                h1 { 
                    color: #5a67d8; 
                    margin-top: 0;
                    font-size: 2rem;
                }
                p { 
                    color: #4a5568; 
                    line-height: 1.8;
                    margin: 1rem 0;
                }
                .token {
                    background: #f7fafc;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    font-family: monospace;
                    word-break: break-all;
                    margin: 1rem 0;
                    border: 2px solid #e2e8f0;
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
                    transition: all 0.2s;
                }
                .btn:hover { 
                    background: #5a67d8;
                    transform: translateY(-2px);
                }
                .status {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #48bb78;
                    color: white;
                    border-radius: 2rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="status">✓ Route Working</div>
                <h1>🔐 Impersonation Feature</h1>
                <p><strong>The impersonation route is functional!</strong></p>
                <p>This feature allows platform admins to securely login as tenant owners for support purposes.</p>
                
                ${token ? `
                    <p style="margin-top: 2rem;">Your token:</p>
                    <div class="token">${token}</div>
                    <p style="font-size: 0.875rem; color: #718096;">Token validation is currently being implemented. This will redirect you to the tenant's dashboard once complete.</p>
                ` : `
                    <p style="color: #e53e3e; font-weight: 600;">No token provided</p>
                    <p style="font-size: 0.875rem; color: #718096;">Impersonation requires a valid token parameter.</p>
                `}
                
                <a href="/en/superadmin" class="btn">← Back to Dashboard</a>
            </div>
        </body>
        </html>
    `, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        }
    })
}
