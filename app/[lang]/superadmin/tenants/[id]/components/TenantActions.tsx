'use client'

import { useState } from 'react'
import { UserCog, Ban, PlayCircle, Download } from 'lucide-react'
import { impersonateTenant, suspendTenantAction, resumeTenantAction, exportTenantUsers } from '../actions'
import ConfirmationModal from './ConfirmationModal'

interface TenantActionsProps {
    tenant: any
}

export default function TenantActions({ tenant }: TenantActionsProps) {
    const [showSuspendModal, setShowSuspendModal] = useState(false)
    const [suspensionReason, setSuspensionReason] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleImpersonate = async () => {
        setIsLoading(true)
        setMessage(null)

        const result = await impersonateTenant(tenant.id)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
            setIsLoading(false)
            return
        }

        // Open in new tab
        window.open(result.url, '_blank')
        setMessage({ type: 'success', text: 'Impersonation session started in new tab' })
        setIsLoading(false)
    }

    const handleSuspend = async () => {
        if (!suspensionReason.trim()) {
            setMessage({ type: 'error', text: 'Please provide a suspension reason' })
            return
        }

        setIsLoading(true)
        const result = await suspendTenantAction(tenant.id, 'SUSPEND', suspensionReason)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Tenant suspended successfully' })
            setSuspensionReason('')
        }

        setIsLoading(false)
        setShowSuspendModal(false)
    }

    const handleResume = async () => {
        setIsLoading(true)
        setMessage(null)

        const result = await resumeTenantAction(tenant.id)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Tenant resumed successfully' })
        }

        setIsLoading(false)
    }

    const handleExport = async () => {
        setIsLoading(true)
        const result = await exportTenantUsers(tenant.id)

        if (!result.success) {
            setMessage({ type: 'error', text: 'Failed to export users' })
        } else {
            // Download CSV
            const blob = new Blob([result.csv], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${tenant.name}_users_${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            window.URL.revokeObjectURL(url)
            setMessage({ type: 'success', text: 'Users exported successfully' })
        }

        setIsLoading(false)
    }

    const isSuspended = tenant.status === 'suspended'

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Impersonate */}
                <button
                    onClick={handleImpersonate}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <UserCog className="w-5 h-5" />
                    Impersonate
                </button>

                {/* Suspend / Resume */}
                {isSuspended ? (
                    <button
                        onClick={handleResume}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <PlayCircle className="w-5 h-5" />
                        Resume
                    </button>
                ) : (
                    <button
                        onClick={() => setShowSuspendModal(true)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        <Ban className="w-5 h-5" />
                        Suspend
                    </button>
                )}

                {/* Export Users */}
                <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Download className="w-5 h-5" />
                    Export User List (CSV)
                </button>
            </div>

            {/* Suspend Modal with Reason Input */}
            {showSuspendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full mx-4 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Suspend Tenant</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Suspension Reason
                            </label>
                            <textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                                placeholder="e.g., Non-payment, Terms violation, etc."
                                rows={3}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Type <span className="font-bold text-white">SUSPEND</span> to confirm
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                placeholder="SUSPEND"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false)
                                    setSuspensionReason('')
                                }}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspend}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Suspend
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
