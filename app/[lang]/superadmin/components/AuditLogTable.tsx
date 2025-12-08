'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { formatActionName, getActionColor, formatRelativeTime, type AuditLog } from '@/lib/platform/audit'

interface AuditLogTableProps {
    logs: AuditLog[]
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    if (logs.length === 0) {
        return (
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
                <p className="text-slate-400">No audit logs found</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-700/50 border-b border-slate-600">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Admin
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Target
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {logs.map((log) => (
                            <>
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-700/30 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {formatRelativeTime(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getActionColor(log.action)}`}>
                                            {formatActionName(log.action)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {log.admin_email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {log.tenant_name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            {expandedId === log.id ? (
                                                <>
                                                    Hide <ChevronUp className="w-3 h-3" />
                                                </>
                                            ) : (
                                                <>
                                                    View <ChevronDown className="w-3 h-3" />
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                                {expandedId === log.id && (
                                    <tr className="bg-slate-900/50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold text-white mb-2">Action Details</h4>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500">Full Timestamp</p>
                                                        <p className="text-sm text-slate-300">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Log ID</p>
                                                        <p className="text-sm text-slate-300 font-mono">{log.id}</p>
                                                    </div>
                                                    {log.target_id && (
                                                        <div>
                                                            <p className="text-xs text-slate-500">Target ID</p>
                                                            <p className="text-sm text-slate-300 font-mono">{log.target_id}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-2">Metadata</p>
                                                        <pre className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300 overflow-x-auto border border-slate-700">
                                                            {JSON.stringify(log.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
