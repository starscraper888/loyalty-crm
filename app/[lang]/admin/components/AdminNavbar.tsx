'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'

export default function AdminNavbar({ email, role }: { email?: string, role?: string }) {
    const pathname = usePathname()
    const lang = pathname.split('/')[1] || 'en'

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
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${lang}/staff/dashboard`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Switch to Staff View &rarr;
                        </Link>
                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">{email}</span>
                        <form action={logout}>
                            <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>
    )
}
