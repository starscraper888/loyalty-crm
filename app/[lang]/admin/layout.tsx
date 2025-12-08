import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNavbar from './components/AdminNavbar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/en/staff/login')
    }

    // Optional: Check if user is actually an admin
    // For now, we rely on RLS and page-level checks, but layout check is good UX
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'owner', 'manager'].includes(profile.role)) {
        // Redirect to staff dashboard if they are staff but not admin
        if (profile?.role === 'staff') {
            redirect('/en/staff/dashboard')
        }
        // Otherwise login
        redirect('/en/staff/login')
    }

    // Check if tenant is suspended (get tenant_id from same profile query)
    const { data: profileWithTenant } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (profileWithTenant) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('status')
            .eq('id', profileWithTenant.tenant_id)
            .single()

        if (tenant?.status === 'suspended') {
            redirect('/en/suspended')
        }
    }

    // Check if user is platform admin
    const { isPlatformAdmin } = await import('@/lib/platform/admin')
    const isSuper = await isPlatformAdmin(user.id)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminNavbar email={user.email} role={profile?.role} isPlatformAdmin={isSuper} />
            {children}
        </div>
    )
}
