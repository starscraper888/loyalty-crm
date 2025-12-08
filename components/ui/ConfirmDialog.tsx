'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl border-2 border-slate-700 max-w-md w-full mx-4 p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {danger && (
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Message */}
                <p className="text-slate-300 mb-6">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors ${danger
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
