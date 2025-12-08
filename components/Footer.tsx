import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product</h3>
                        <ul className="space-y-2">
                            <li><Link href="/en/member/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Member Portal</Link></li>
                            <li><Link href="/en/admin/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Admin Dashboard</Link></li>
                            <li><Link href="/en/admin/analytics" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Analytics</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h3>
                        <ul className="space-y-2">
                            <li><Link href="/en/admin/calculator" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Pricing Calculator</Link></li>
                            <li><Link href="/en/admin/campaigns" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Campaigns</Link></li>
                            <li><Link href="/en/member/referrals" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Referral Program</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legal</h3>
                        <ul className="space-y-2">
                            <li><Link href="/en/legal/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Privacy Policy</Link></li>
                            <li><Link href="/en/legal/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Terms of Service</Link></li>
                            <li><Link href="/en/settings/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Data & Privacy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Support</h3>
                        <ul className="space-y-2">
                            <li><a href="mailto:support@yourcompany.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Contact Support</a></li>
                            <li><Link href="/en/staff/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">Staff Login</Link></li>
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
