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

                {/* Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Points Earned Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                            Points Earned
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                                    />
                                    <Area type="monotone" dataKey="points_earned" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarned)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Points Redeemed Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                            Points Redeemed
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.dailyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                                        cursor={{ fill: '#374151', opacity: 0.2 }}
                                    />
                                    <Bar dataKey="points_redeemed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transaction Volume */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Transaction Volume
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.dailyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                                    />
                                    <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                            Period Summary
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points Earned</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-green-600 dark:text-green-400">+{data.summary.totalPointsEarned.toLocaleString()}</span>
                                    <span className="text-xs text-green-600/70 dark:text-green-400/70">Total gained</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Points Redeemed</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-red-600 dark:text-red-400">-{data.summary.totalPointsRedeemed.toLocaleString()}</span>
                                    <span className="text-xs text-red-600/70 dark:text-red-400/70">Total spent</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Members</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">{data.summary.newMembersInPeriod}</span>
                                    <span className="text-xs text-blue-600/70 dark:text-blue-400/70">Sign ups</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Pts/Transaction</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {data.summary.totalTransactions > 0
                                            ? Math.round(data.summary.totalPointsEarned / data.summary.totalTransactions)
                                            : 0}
                                    </span>
                                    <span className="text-xs text-purple-600/70 dark:text-purple-400/70">Per visit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
