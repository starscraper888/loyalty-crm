import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AddMemberForm from './components/AddMemberForm'
import MembersTable from './components/MembersTable'

export default async function MembersPage() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Fetch profiles with tier information
    const { data: members } = await supabase
        .from('profiles')
        .select(`
            *,
            tier:member_tiers(id, name, color, icon)
        `)
        .order('created_at', { ascending: false })

    // Fetch auth users to get emails
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()

    // Map emails to profiles
    const userMap = new Map(users?.map(u => [u.id, u.email]) || [])

    const membersWithEmail = members?.map((member: any) => ({
        ...member,
        email: userMap.get(member.id) || 'N/A'
    }))

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

    const currentUserRole = profile?.role
    const isManager = currentUserRole === 'manager'

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                </div>

                {!isManager && <AddMemberForm />}

                <MembersTable initialMembers={membersWithEmail || []} isManager={isManager} currentUserRole={currentUserRole} />
            </div>
        </div>
    )
}
