import { createClient } from '@/lib/supabase/server'
import { createReward } from '@/app/admin/actions'
import RewardItem from './components/RewardItem'

export default async function RewardsPage() {
    const supabase = await createClient()

    const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false })

    // Fetch profile to get role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

    const isManager = profile?.role === 'manager'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Manage Rewards</h1>

                {/* Create Form */}
                {!isManager && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add New Reward</h2>
                        <form action={async (formData) => {
                            'use server'
                            await createReward(formData)
                        }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                    <input name="name" type="text" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost (Points)</label>
                                    <input name="cost" type="number" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image (512×512 recommended)</label>
                                    <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input name="description" type="text" placeholder="Description (optional)" className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Add Reward</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards?.map((reward: any) => (
                        <RewardItem key={reward.id} reward={reward} isManager={isManager} />
                    ))}
                </div>
            </div>
        </div>
    )
}
