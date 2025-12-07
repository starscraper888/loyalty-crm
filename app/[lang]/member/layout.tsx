import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MemberLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${lang}/auth/login`)
    }

    // Check if user is a member
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'member') {
        redirect(`/${lang}/auth/login`)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navbar */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex space-x-8">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-blue-600">Loyalty Member</h1>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href={`/${lang}/member/dashboard`}
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href={`/${lang}/member/history`}
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                                >
                                    History
                                </Link>
                                <Link
                                    href={`/${lang}/member/rewards`}
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                                >
                                    Rewards
                                </Link>
                                <Link
                                    href={`/${lang}/member/qr-code`}
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                                >
                                    QR Code
                                </Link>
                            </div>
                        </div>

                        {/* Logout */}
                        <div className="flex items-center">
                            <form action="/auth/signout" method="post">
                                <button
                                    type="submit"
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href={`/${lang}/member/dashboard`}
                            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href={`/${lang}/member/history`}
                            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            History
                        </Link>
                        <Link
                            href={`/${lang}/member/rewards`}
                            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Rewards
                        </Link>
                        <Link
                            href={`/${lang}/member/qr-code`}
                            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            QR Code
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}
