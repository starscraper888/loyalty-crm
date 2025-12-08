'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, Ban, PlayCircle, Download } from 'lucide-react'
import { impersonateTenant, suspendTenantAction, resumeTenantAction, exportTenantUsers } from '../actions'

interface TenantActionsProps {
    tenant: any
}

export default function TenantActions({ tenant }: TenantActionsProps) {
    const router = useRouter()
    const [showSuspendModal, setShowSuspendModal] = useState(false)
    const [suspensionReason, setSuspensionReason] = useState('')
    const [confirmPhrase, setConfirmPhrase] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleImpersonate = async () => {
        setIsLoading(true)
        setMessage(null)

        const result = await impersonateTenant(tenant.id)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
            setIsLoading(false)
        } else if (result.url) {
            // Navigate in same window
            router.push(result.url)
        }
    }

    const handleSuspend = async () => {
        if (!suspensionReason.trim()) {
            setMessage({ type: 'error', text: 'Please provide a suspension reason' })
            return
        }

        if (confirmPhrase !== 'SUSPEND') {
            setMessage({ type: 'error', text: 'Please type SUSPEND to confirm' })
            return
        }

        setIsLoading(true)
        const result = await suspendTenantAction(tenant.id, confirmPhrase, suspensionReason)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: 'Tenant suspended successfully' })
            setSuspensionReason('')
            setConfirmPhrase('')
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
        setMessage(null)

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
        <div className="w-full bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Impersonate */}
                <button
                    onClick={handleImpersonate}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UserCog className="w-5 h-5" />
                    <span>Impersonate</span>
                </button>

                {/* Suspend / Resume */}
                {isSuspended ? (
                    <button
                        onClick={handleResume}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlayCircle className="w-5 h-5" />
                        <span>Resume Account</span>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowSuspendModal(true)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Ban className="w-5 h-5" />
                        <span>Suspend Account</span>
                    </button>
                )}

                {/* Export Users */}
                <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="w-full sm:col-span-2 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-5 h-5" />
                    <span>Export Members (CSV)</span>
                </button>
            </div>

            {/* Suspend Modal */}
            {showSuspendModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border-2 border-red-500/40 max-w-md w-full mx-4 p-6 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6">Suspend Tenant</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Suspension Reason
                            </label>
                            <textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="e.g., Non-payment, Terms violation, etc."
                                rows={3}
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Type <span className="font-bold text-red-400">SUSPEND</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmPhrase}
                                onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="SUSPEND"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSuspendModal(false)
                                    setSuspensionReason('')
                                    setConfirmPhrase('')
                                }}
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSuspend}
                                disabled={isLoading || confirmPhrase !== 'SUSPEND' || !suspensionReason.trim()}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Suspending...' : 'Suspend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
