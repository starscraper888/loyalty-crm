import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MemberHistoryTable from '../components/MemberHistoryTable'
import Link from 'next/link'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (profileError || !profile) {
        return <div className="p-8 text-red-500">Member not found.</div>
    }

    // 2. Fetch Email from Auth (since it might not be in profile yet if we didn't sync it perfectly)
    const { data: { user } } = await adminSupabase.auth.admin.getUserById(id)
    const email = user?.email || 'N/A'

    // 3. Fetch Transaction History
    const { data: transactions, error: ledgerError } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link href="/en/admin/members" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                        ← Back to Members
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
                        {profile.full_name}
                        <span className="text-sm font-normal px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 capitalize">
                            {profile.role}
                        </span>
                    </h1>
                </div>

                {/* Member Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Balance</div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{profile.points_balance} pts</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Contact Info</div>
                        <div className="font-medium text-gray-900 dark:text-white">{email}</div>
                        <div className="text-gray-500 dark:text-gray-400">{profile.phone}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Joined Date</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {new Date(profile.created_at).toLocaleDateString('en-GB', {
                                timeZone: 'Asia/Singapore',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(profile.created_at).toLocaleTimeString('en-GB', {
                                timeZone: 'Asia/Singapore',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                            })}
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Transaction History</h2>
                    <MemberHistoryTable transactions={transactions || []} />
                </div>
            </div>
        </div>
    )
}
