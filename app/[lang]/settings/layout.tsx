import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNavbar from '../admin/components/AdminNavbar'

export default async function SettingsLayout({
    children,
    params
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

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'owner', 'manager'].includes(profile.role)) {
        redirect(`/${lang}/staff/login`)
    }

    // DON'T check suspension here - allow billing access even when suspended
    // This is intentional to let users update payment methods

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
