import { createClient } from '@/lib/supabase/server'
import { createReward } from '@/app/admin/actions'
import RewardItem from './components/RewardItem'

export default async function RewardsPage() {
    const supabase = await createClient()

    const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Manage Rewards</h1>

                {/* Create Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add New Reward</h2>
                    <form action={async (formData) => {
                        'use server'
                        await createReward(formData)
                    }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input name="name" type="text" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost (Points)</label>
                            <input name="cost" type="number" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <div className="flex gap-2">
                                <input name="description" type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards?.map((reward: any) => (
                        <RewardItem key={reward.id} reward={reward} />
                    ))}
                </div>
            </div>
        </div>
    )
}
