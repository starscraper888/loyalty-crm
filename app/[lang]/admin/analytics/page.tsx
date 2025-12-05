'use client'

import { getAnalyticsData } from '@/lib/analytics'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [range, setRange] = useState<'7d' | '30d'>('7d')
    const [locale, setLocale] = useState<'en' | 'bm' | 'zh'>('en')

    useEffect(() => {
        getAnalyticsData(range).then(setData)
    }, [range])

    if (!data) return <div className="p-8">Loading analytics...</div>

    const t = {
        en: { title: 'Analytics Dashboard', active: 'Active Members', revenue: 'Revenue', repeat: 'Repeat Rate', rm100: 'RM / 100 Members' },
        bm: { title: 'Papan Analytics', active: 'Ahli Aktif', revenue: 'Hasil', repeat: 'Kadar Ulangan', rm100: 'RM / 100 Ahli' },
        zh: { title: '分析仪表板', active: '活跃会员', revenue: '收入', repeat: '回头率', rm100: '每100位会员收入' }
    }[locale]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>

                    <div className="flex gap-4">
                        {/* Locale Toggle */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border dark:border-gray-700">
                            {(['en', 'bm', 'zh'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLocale(l)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${locale === l
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {l.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Range Toggle */}
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value as '7d' | '30d')}
                            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.revenue}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">RM {data.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.active}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.activeMembers}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.repeat}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.summary.repeatRate}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Members Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.active}</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.dailyMetrics}>
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="active_members" stroke="#3B82F6" fillOpacity={1} fill="url(#colorActive)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.revenue}</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Bar dataKey="revenue" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Repeat Rate Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.repeat}</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="repeat_rate" stroke="#8B5CF6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RM / 100 Members Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.rm100}</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="rm_per_100" stroke="#F59E0B" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
