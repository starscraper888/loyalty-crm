import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MemberItem from './components/MemberItem'
import AddMemberForm from './components/AddMemberForm'

export default async function MembersPage() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Fetch profiles
    const { data: members } = await supabase
        .from('profiles')
        .select('*')
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

    const isManager = profile?.role === 'manager'

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                </div>

                {!isManager && <AddMemberForm />}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {membersWithEmail?.map((member: any) => (
                                <MemberItem key={member.id} member={member} isManager={isManager} />
                            ))}
                            {!membersWithEmail?.length && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No members found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
