'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [range, setRange] = useState<'7d' | '30d'>('7d')

    useEffect(() => {
        fetch(`/api/analytics?range=${range}`)
            .then(res => res.json())
            .then(setData)
    }, [range])

    if (!data) return <div className="p-8">Loading analytics...</div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>

                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value as '7d' | '30d')}
                        className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalMembers}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Rewards</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.activeRewards}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.totalTransactions}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Redemption Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.redemptionRate}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Points Earned Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Points Earned</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyMetrics}>
                                    <defs>
                                        <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="points_earned" stroke="#10B981" fillOpacity={1} fill="url(#colorEarned)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Points Redeemed Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Points Redeemed</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Bar dataKey="points_redeemed" fill="#EF4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transaction Volume */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Transaction Volume</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Period Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points Earned</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">+{data.summary.totalPointsEarned.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points Redeemed</span>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">-{data.summary.totalPointsRedeemed.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Members</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.summary.newMembersInPeriod}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Points/Transaction</span>
                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {data.summary.totalTransactions > 0
                                        ? Math.round(data.summary.totalPointsEarned / data.summary.totalTransactions)
                                        : 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
