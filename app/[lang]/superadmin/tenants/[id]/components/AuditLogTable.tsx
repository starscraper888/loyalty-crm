import { Clock, User, CheckCircle, XCircle } from 'lucide-react'

interface AuditLogTableProps {
    logs: any[]
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <p className="text-center text-slate-400">No audit logs found</p>
            </div>
        )
    }

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            'CREATE_MEMBER': 'Created Member',
            'UPDATE_MEMBER': 'Updated Member',
            'DELETE_MEMBER': 'Deleted Member',
            'ISSUE_POINTS': 'Issued Points',
            'REDEEM_REWARD': 'Redeemed Reward',
            'CREATE_REWARD': 'Created Reward',
            'UPDATE_REWARD': 'Updated Reward',
            'DELETE_REWARD': 'Deleted Reward',
            'CHANGE_PLAN': 'Changed Plan',
            'BUY_CREDITS': 'Purchased Credits',
            'TENANT_SUSPENDED': 'Tenant Suspended',
            'TENANT_DELETED': 'Tenant Deleted'
        }
        return labels[action] || action
    }

    const getActionColor = (action: string) => {
        if (action.startsWith('CREATE')) return 'text-green-400'
        if (action.startsWith('UPDATE')) return 'text-blue-400'
        if (action.startsWith('DELETE') || action.includes('SUSPEND')) return 'text-red-400'
        return 'text-purple-400'
    }

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-700/50">
                        <tr className="text-left text-sm text-slate-400">
                            <th className="px-6 py-4 font-medium">Timestamp</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                            <th className="px-6 py-4 font-medium">Actor</th>
                            <th className="px-6 py-4 font-medium">Details</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        <span>{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <User className="w-4 h-4 text-slate-500" />
                                        <span>{log.actor_id ? log.actor_id.substring(0, 8) + '...' : 'System'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-400 max-w-md truncate">
                                        {log.metadata ? JSON.stringify(log.metadata).substring(0, 100) : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {log.status === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : log.status === 'failure' ? (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-slate-600" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {logs.length >= 50 && (
                <div className="px-6 py-4 bg-slate-700/30 border-t border-slate-700 text-center">
                    <p className="text-sm text-slate-400">
                        Showing last 50 actions. Full audit log export coming soon.
                    </p>
                </div>
            )}
        </div>
    )
}
