import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legal</h3>
                        <ul className="space-y-2">
                            <li><Link href="/en/legal/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Privacy Policy</Link></li>
                            <li><Link href="/en/legal/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Terms of Service</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account</h3>
                        <ul className="space-y-2">
                            <li><Link href="/en/staff/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Staff Login</Link></li>
                            <li><Link href="/en/superadmin/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Platform Admin</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Support</h3>
                        <ul className="space-y-2">
                            <li><a href="mailto:support@yourcompany.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Contact Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        © {new Date().getFullYear()} Loyalty CRM. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
