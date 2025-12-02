'use client'

import { useState, useEffect } from 'react'
import { getRates, updateRate } from '@/app/admin/calculator/actions'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

type Rate = {
    id: string
    country_code: string
    category: string
    rate: number
    currency: string
}

export default function CalculatorPage() {
    const [rates, setRates] = useState<Rate[]>([])
    const [loading, setLoading] = useState(true)

    // Calculator State
    const [selectedCountry, setSelectedCountry] = useState('MY')
    const [selectedCategory, setSelectedCategory] = useState('marketing')
    const [userCount, setUserCount] = useState(1000)
    const [msgsPerMonth, setMsgsPerMonth] = useState(4)
    const [growthRate, setGrowthRate] = useState(5) // 5% monthly growth

    useEffect(() => {
        loadRates()
    }, [])

    async function loadRates() {
        try {
            const data = await getRates()
            setRates(data)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    async function handleRateUpdate(id: string, newRate: string) {
        const rate = parseFloat(newRate)
        if (isNaN(rate)) return
        await updateRate(id, rate)
        loadRates()
    }

    // Projection Logic
    const currentRate = rates.find(r => r.country_code === selectedCountry && r.category === selectedCategory)?.rate || 0

    const projectionData = []
    let currentUsers = userCount
    let totalCost = 0

    for (let i = 1; i <= 12; i++) {
        const monthlyCost = currentUsers * msgsPerMonth * currentRate
        totalCost += monthlyCost

        projectionData.push({
            month: `Month ${i}`,
            users: Math.round(currentUsers),
            cost: Math.round(monthlyCost),
            cumulative: Math.round(totalCost)
        })

        currentUsers = currentUsers * (1 + growthRate / 100)
    }

    const uniqueCountries = Array.from(new Set(rates.map(r => r.country_code)))
    const uniqueCategories = Array.from(new Set(rates.map(r => r.category)))

    if (loading) return <div className="p-8">Loading calculator...</div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Cost Calculator</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Configuration */}
                    <div className="space-y-8">
                        {/* Calculator Inputs */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Projection Inputs</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                        <select
                                            value={selectedCountry}
                                            onChange={e => setSelectedCountry(e.target.value)}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={e => setSelectedCategory(e.target.value)}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Users</label>
                                    <input
                                        type="number"
                                        value={userCount}
                                        onChange={e => setUserCount(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Messages / Month / User</label>
                                    <input
                                        type="number"
                                        value={msgsPerMonth}
                                        onChange={e => setMsgsPerMonth(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Growth Rate (%)</label>
                                    <input
                                        type="number"
                                        value={growthRate}
                                        onChange={e => setGrowthRate(Number(e.target.value))}
                                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                <div className="pt-4 border-t dark:border-gray-700">
                                    <p className="text-sm text-gray-500">Current Rate: <span className="font-bold text-gray-900 dark:text-white">{currentRate.toFixed(4)} MYR</span> / msg</p>
                                </div>
                            </div>
                        </div>

                        {/* Rate Configuration Table */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Rate Configuration</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Country</th>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3">Rate (MYR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rates.map(rate => (
                                            <tr key={rate.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{rate.country_code}</td>
                                                <td className="px-6 py-4">{rate.category}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        step="0.0001"
                                                        defaultValue={rate.rate}
                                                        onBlur={(e) => handleRateUpdate(rate.id, e.target.value)}
                                                        className="w-24 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Projections */}
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-600 dark:text-blue-300">Est. Monthly Cost (Month 1)</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">MYR {projectionData[0].cost.toLocaleString()}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                                <p className="text-sm text-purple-600 dark:text-purple-300">Est. Annual Cost</p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">MYR {projectionData[11].cumulative.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Monthly Cost Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Monthly Cost Projection (1 Year)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: number) => [`MYR ${value.toLocaleString()}`, 'Cost']}
                                        />
                                        <Bar dataKey="cost" fill="#3B82F6" name="Monthly Cost" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* User Growth Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Growth Projection</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={projectionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="Users" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
