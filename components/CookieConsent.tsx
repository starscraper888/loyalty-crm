'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false)
    const [showCustomize, setShowCustomize] = useState(false)

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent')
        if (!consent) {
            setShowBanner(true)
        }
    }, [])

    const acceptAll = () => {
        localStorage.setItem('cookie-consent', JSON.stringify({
            essential: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        }))
        setShowBanner(false)
    }

    const rejectNonEssential = () => {
        localStorage.setItem('cookie-consent', JSON.stringify({
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        }))
        setShowBanner(false)
    }

    const saveCustomPreferences = (analytics: boolean, marketing: boolean) => {
        localStorage.setItem('cookie-consent', JSON.stringify({
            essential: true,
            analytics,
            marketing,
            timestamp: new Date().toISOString()
        }))
        setShowBanner(false)
        setShowCustomize(false)
    }

    if (!showBanner) return null

    if (showCustomize) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cookie Preferences</h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <input type="checkbox" checked disabled className="mt-1" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Essential Cookies</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Required for the website to function. Cannot be disabled.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="analytics"
                                defaultChecked
                                className="mt-1"
                            />
                            <div>
                                <label htmlFor="analytics" className="font-medium text-gray-900 dark:text-white cursor-pointer">Analytics Cookies</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Help us understand how you use our site.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="marketing"
                                defaultChecked={false}
                                className="mt-1"
                            />
                            <div>
                                <label htmlFor="marketing" className="font-medium text-gray-900 dark:text-white cursor-pointer">Marketing Cookies</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Used to deliver personalized ads.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCustomize(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                const analytics = (document.getElementById('analytics') as HTMLInputElement).checked
                                const marketing = (document.getElementById('marketing') as HTMLInputElement).checked
                                saveCustomPreferences(analytics, marketing)
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50">
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
                            <Link href="/en/legal/privacy" className="text-blue-600 hover:text-blue-800 underline">
                                Learn more
                            </Link>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button
                            onClick={() => setShowCustomize(true)}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                        >
                            Customize
                        </button>
                        <button
                            onClick={rejectNonEssential}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                        >
                            Reject Non-Essential
                        </button>
                        <button
                            onClick={acceptAll}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
