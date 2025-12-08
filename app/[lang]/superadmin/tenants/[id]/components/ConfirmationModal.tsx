'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmPhrase?: string
    confirmButtonText?: string
    isDangerous?: boolean
    requiresPhrase?: boolean
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmPhrase = 'CONFIRM',
    confirmButtonText = 'Confirm',
    isDangerous = false,
    requiresPhrase = false
}: ConfirmationModalProps) {
    const [inputPhrase, setInputPhrase] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleConfirm = async () => {
        if (requiresPhrase && inputPhrase !== confirmPhrase) {
            return
        }

        setIsSubmitting(true)
        await onConfirm()
        setIsSubmitting(false)
        setInputPhrase('')
        onClose()
    }

    const isValid = !requiresPhrase || inputPhrase === confirmPhrase

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message */}
                <p className="text-slate-300 mb-6">{message}</p>

                {/* Phrase Input */}
                {requiresPhrase && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Type <span className="font-bold text-white">{confirmPhrase}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={inputPhrase}
                            onChange={(e) => setInputPhrase(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                            placeholder={confirmPhrase}
                            autoFocus
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid || isSubmitting}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDangerous
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isSubmitting ? 'Processing...' : confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    )
}
