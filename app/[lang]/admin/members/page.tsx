import { createClient } from '@/lib/supabase/server'
import MemberItem from './components/MemberItem'
import AddMemberForm from './components/AddMemberForm'

export default async function MembersPage() {
    const supabase = await createClient()

    // In a real app, we'd have pagination and search
    const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
    // .limit(20)

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                </div>

                <AddMemberForm />

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {members?.map((member: any) => (
                                <MemberItem key={member.id} member={member} />
                            ))}
                            {!members?.length && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No members found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
