'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface RevenueByTierChartProps {
    data: { tier: string; count: number; revenue: number }[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981']

export default function RevenueByTierChart({ data }: RevenueByTierChartProps) {
    const chartData = data.map(item => ({
        name: item.tier,
        value: item.revenue,
        count: item.count
    }))

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-6">Revenue by Tier</h3>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number, name, props: any) => [
                            `$${value} (${props.payload.count} subs)`,
                            name
                        ]}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ color: '#94a3b8' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
