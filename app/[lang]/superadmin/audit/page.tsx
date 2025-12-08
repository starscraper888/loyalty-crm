import { Suspense } from 'react'
import { Shield, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { getAuditLogs, getAuditLogActions, getPlatformAdmins } from '@/lib/platform/audit'
import AuditLogTable from '../components/AuditLogTable'

export const dynamic = 'force-dynamic'

interface PageProps {
    searchParams: {
        page?: string
        action?: string
        admin?: string
    }
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
    const page = parseInt(searchParams.page || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const filters = {
        action: searchParams.action,
        adminId: searchParams.admin
    }

    const [{ logs, total }, actions, admins] = await Promise.all([
        getAuditLogs(limit, offset, filters),
        getAuditLogActions(),
        getPlatformAdmins()
    ])

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/en/superadmin"
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-6 h-6 text-blue-400" />
                                <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                            </div>
                            <p className="text-slate-400 text-sm">Platform admin action history</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-medium text-slate-400">Total Actions</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{total.toLocaleString()}</p>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-medium text-slate-400">Action Types</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{actions.length}</p>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-green-400" />
                            <h3 className="text-sm font-medium text-slate-400">Admins</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{admins.length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mb-6">
                    <form method="get" className="flex gap-4">
                        <div className="flex-1">
                            <select
                                name="action"
                                defaultValue={searchParams.action || ''}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Actions</option>
                                {actions.map(action => (
                                    <option key={action} value={action}>
                                        {action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <select
                                name="admin"
                                defaultValue={searchParams.admin || ''}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Admins</option>
                                {admins.map(admin => (
                                    <option key={admin.id} value={admin.id}>
                                        {admin.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Apply Filters
                        </button>

                        {(searchParams.action || searchParams.admin) && (
                            <Link
                                href="/en/superadmin/audit"
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Clear
                            </Link>
                        )}
                    </form>
                </div>

                {/* Audit Log Table */}
                <Suspense fallback={<div className="bg-slate-800 rounded-xl h-96 animate-pulse" />}>
                    <AuditLogTable logs={logs} />
                </Suspense>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} logs
                        </p>

                        <div className="flex gap-2">
                            {page > 1 && (
                                <Link
                                    href={`/en/superadmin/audit?page=${page - 1}${searchParams.action ? `&action=${searchParams.action}` : ''}${searchParams.admin ? `&admin=${searchParams.admin}` : ''}`}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    ← Previous
                                </Link>
                            )}

                            <span className="px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700">
                                Page {page} of {totalPages}
                            </span>

                            {page < totalPages && (
                                <Link
                                    href={`/en/superadmin/audit?page=${page + 1}${searchParams.action ? `&action=${searchParams.action}` : ''}${searchParams.admin ? `&admin=${searchParams.admin}` : ''}`}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Next →
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
