import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNavbar from './components/AdminNavbar'
import ImpersonationBanner from './components/ImpersonationBanner'

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${lang}/staff/login`)
    }

    // Optional: Check if user is actually an admin
    // For now, we rely on RLS and page-level checks, but layout check is good UX
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'owner', 'manager'].includes(profile.role)) {
        // Redirect to staff dashboard if they are staff but not admin
        if (profile?.role === 'staff') {
            redirect(`/${lang}/staff/dashboard`)
        }
        // Otherwise login
        redirect(`/${lang}/staff/login`)
    }

    // Check if tenant is suspended (get tenant_id from same profile query)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('status')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.status === 'suspended') {
        redirect(`/${lang}/suspended`)
    }

    // Check if user is platform admin
    const { isPlatformAdmin } = await import('@/lib/platform/admin')
    const isSuper = await isPlatformAdmin(user.id)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <ImpersonationBanner />
            <AdminNavbar email={user.email} role={profile?.role} isPlatformAdmin={isSuper} />
            {children}
        </div>
    )
}
