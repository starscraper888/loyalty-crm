import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600 dark:text-gray-300">{user?.email}</span>
                        <form action={logout}>
                            <button className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                Logout
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Members</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">1,234</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Points Issued</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">45,670</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Redemptions</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">89</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a href="/en/staff/redeem" className="flex items-center justify-center p-8 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition">
                        <span className="text-xl font-bold">Scan / Redeem</span>
                    </a>
                    <button className="flex items-center justify-center p-8 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition">
                        <span className="text-xl font-bold">Issue Points</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
