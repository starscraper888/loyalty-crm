import { getMyTransactions } from '@/app/member/actions'
import { redirect } from 'next/navigation'
import MemberHistoryTable from '../components/MemberHistoryTable'

export default async function MemberHistoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    const result = await getMyTransactions()

    if (result.error) {
        redirect(`/${lang}/auth/login`)
    }

    const transactions = result.transactions || []

    return (
        <div className="px-4 sm:px-0">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    View all your points activity
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <MemberHistoryTable transactions={transactions} />
            </div>
        </div>
    )
}
