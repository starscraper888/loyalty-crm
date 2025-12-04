import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffNavbar from './components/StaffNavbar'

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <StaffNavbar email={user.email} />
            {children}
        </div>
    )
}
