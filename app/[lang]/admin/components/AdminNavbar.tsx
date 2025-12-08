'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function AdminNavbar({ email, role, isPlatformAdmin }: { email?: string, role?: string, isPlatformAdmin?: boolean }) {
    const pathname = usePathname()
    const lang = pathname.split('/')[1] || 'en'
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (path: string) => pathname.startsWith(`/${lang}${path}`)

    const isManager = role === 'manager'

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href={`/${lang}/admin/dashboard`} className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Loyalty Admin
                            </Link>
                        </div>
                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-6 md:flex md:space-x-8">
                            <Link
                                href={`/${lang}/admin/dashboard`}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/dashboard') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href={`/${lang}/admin/rewards`}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/rewards') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                            >
                                Rewards
                            </Link>
                            <Link
                                href={`/${lang}/admin/members`}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/members') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                            >
                                Members
                            </Link>
                            {!isManager && (
                                <Link
                                    href={`/${lang}/admin/campaigns`}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/campaigns') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                                >
                                    Campaigns
                                </Link>
                            )}
                            <Link
                                href={`/${lang}/admin/analytics`}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/admin/analytics') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                            >
                                Analytics
                            </Link>
                            <Link
                                href={`/${lang}/settings/billing`}
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/settings/billing') ? 'border-blue-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}
                            >
                                Billing
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Right Side */}
                    <div className="hidden md:flex items-center gap-4">
                        {isPlatformAdmin && (
                            <Link
                                href={`/${lang}/superadmin`}
                                className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                                Platform Admin
                            </Link>
                        )}
                        <Link
                            href={`/${lang}/staff/dashboard`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Staff View →
                        </Link>
                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block">{email}</span>
                        <form action={logout}>
                            <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Logout
                            </button>
                        </form>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href={`/${lang}/admin/dashboard`}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/admin/dashboard') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href={`/${lang}/admin/rewards`}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/admin/rewards') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Rewards
                        </Link>
                        <Link
                            href={`/${lang}/admin/members`}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/admin/members') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Members
                        </Link>
                        {!isManager && (
                            <Link
                                href={`/${lang}/admin/campaigns`}
                                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/admin/campaigns') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Campaigns
                            </Link>
                        )}
                        <Link
                            href={`/${lang}/admin/analytics`}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/admin/analytics') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Analytics
                        </Link>
                        <Link
                            href={`/${lang}/settings/billing`}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/settings/billing') ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Billing
                        </Link>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="px-4 space-y-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{email}</div>
                            {isPlatformAdmin && (
                                <Link
                                    href={`/${lang}/superadmin`}
                                    className="block text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Platform Admin
                                </Link>
                            )}
                            <Link
                                href={`/${lang}/staff/dashboard`}
                                className="block text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Staff View →
                            </Link>
                            <form action={logout}>
                                <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
