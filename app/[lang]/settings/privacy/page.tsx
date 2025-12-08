'use client'

import { useState } from 'react'
import { Download, Trash2, Shield, Cookie } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function PrivacySettingsPage() {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExportData = async () => {
        setIsExporting(true)
        setError(null)

        try {
            const response = await fetch('/api/gdpr/export')
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            setError('Failed to export data. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE') {
            setError('Please type DELETE to confirm')
            return
        }

        setIsDeleting(true)
        setError(null)

        try {
            const response = await fetch('/api/gdpr/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: deleteConfirmation })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Deletion failed')
            }

            // Redirect to home after successful deletion
            window.location.href = '/'
        } catch (err: any) {
            setError(err.message || 'Failed to delete account. Please contact support.')
            setIsDeleting(false)
        }
    }

    const handleManageCookies = () => {
        // Clear cookie consent to show banner again
        localStorage.removeItem('cookie-consent')
        window.location.reload()
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Data</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your privacy settings and data</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Data Export */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Download Your Data</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Export all your personal data, including profile information, transaction history, and redemptions in JSON format.
                                </p>
                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Export Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cookie Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Cookie className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cookie Preferences</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Manage your cookie settings and consent preferences.
                                </p>
                                <button
                                    onClick={handleManageCookies}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Cookie className="w-4 h-4" />
                                    Manage Cookies
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Policy Link */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Privacy Information</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Learn about how we collect, use, and protect your data.
                                </p>
                                <a
                                    href="/en/legal/privacy"
                                    target="_blank"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                    Read Privacy Policy →
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account - Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-800 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Delete Account</h2>
                                <p className="text-red-700 dark:text-red-300 mb-4">
                                    Permanently delete your account and remove your personal information.
                                    <strong> This action cannot be undone.</strong>
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                                    Note: Anonymized transaction records will be retained for 7 years to comply with financial regulations.
                                </p>
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4">Confirm Account Deletion</h3>

                            <div className="mb-6">
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    This will permanently delete your account. Your personal information will be removed, but anonymized transaction records will be kept for legal compliance.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Type <strong className="text-red-600 dark:text-red-400">DELETE</strong> below to confirm:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="Type DELETE"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteDialog(false)
                                        setDeleteConfirmation('')
                                        setError(null)
                                    }}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
