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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <StaffNavbar email={user.email} role={profile?.role} />
            {children}
        </div>
    )
}
