import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminMemberHistory from '../components/AdminMemberHistory'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

    // 2. Fetch Email from Auth
    const { data: { user } } = await adminSupabase.auth.admin.getUserById(id)
    const email = user?.email || 'N/A'

    // 3. Fetch Transaction History with redemption details
    const { data: ledger } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false })

    // 4. Fetch redemption details to get status
    const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('id, status, redeemed_at')
        .eq('profile_id', id)

    // Map redemption status to transactions (match by timestamp)
    const transactions = ledger?.map(t => {
        if (t.type === 'redeem' && redemptionsData) {
            // Find redemption that matches this transaction by timestamp
            const redemption = redemptionsData.find(r => {
                const tTime = new Date(t.created_at).getTime()
                const rTime = new Date(r.redeemed_at).getTime()
                const timeDiff = Math.abs(tTime - rTime)

                // Match if within 60 seconds OR same date (for cases where time sync is off)
                const sameDate = new Date(t.created_at).toDateString() === new Date(r.redeemed_at).toDateString()

                return timeDiff < 60000 || sameDate
            })

            if (redemption) {
                return {
                    ...t,
                    redemption_id: redemption.id, // Store redemption ID separately
                    status: redemption.status || 'completed'
                }
            }
        }
        return t
    }) || []

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
                    <AdminMemberHistory transactions={transactions} memberId={id} />
                </div>
            </div>
        </div>
    )
}
