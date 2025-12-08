'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Participant {
    id: string
    points_earned: number
    participated_at: string
    profile: {
        full_name: string
        email?: string
    }
}

export default function CampaignAnalytics({ campaignId, participants }: {
    campaignId: string
    participants: Participant[]
}) {
    // Group participants by date
    const participationByDate = participants.reduce((acc, p) => {
        const date = new Date(p.participated_at).toLocaleDateString()
        if (!acc[date]) {
            acc[date] = { date, participants: 0, points: 0 }
        }
        acc[date].participants += 1
        acc[date].points += p.points_earned
        return acc
    }, {} as Record<string, { date: string, participants: number, points: number }>)

    const timelineData = Object.values(participationByDate).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Top participants
    const topParticipants = [...participants]
        .sort((a, b) => b.points_earned - a.points_earned)
        .slice(0, 10)

    // Points distribution
    const distributionData = [
        { name: '1-50 pts', count: participants.filter(p => p.points_earned >= 1 && p.points_earned <= 50).length },
        { name: '51-100 pts', count: participants.filter(p => p.points_earned >= 51 && p.points_earned <= 100).length },
        { name: '101-200 pts', count: participants.filter(p => p.points_earned >= 101 && p.points_earned <= 200).length },
        { name: '200+ pts', count: participants.filter(p => p.points_earned > 200).length },
    ].filter(d => d.count > 0)

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

    return (
        <div className="space-y-6">
            {/* Participation Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Participation Over Time</h2>
                <div className="h-[300px]">
                    {timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#F3F4F6'
                                    }}
                                />
                                <Bar dataKey="participants" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            No participation data yet
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Points Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Points Distribution</h2>
                    <div className="h-[300px]">
                        {distributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#F3F4F6'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                No distribution data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Participants */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Participants</h2>
                    <div className="space-y-3">
                        {topParticipants.length > 0 ? (
                            topParticipants.map((participant, index) => (
                                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {participant.profile.full_name}
                                            </p>
                                            {participant.profile.email && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {participant.profile.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                                            {participant.points_earned} pts
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                                No participants yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
