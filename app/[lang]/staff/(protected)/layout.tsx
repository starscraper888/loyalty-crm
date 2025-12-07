import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffNavbar from '../components/StaffNavbar'

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/en/staff/login')
    }

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Check if user is platform admin
    const { isPlatformAdmin } = await import('@/lib/platform/admin')
    const isSuper = await isPlatformAdmin(user.id)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <StaffNavbar email={user.email} role={profile?.role} isPlatformAdmin={isSuper} />
            {children}
        </div>
    )
}
