import { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import SuperAdminLoginForm from './components/SuperAdminLoginForm'

export const metadata: Metadata = {
    title: 'Platform Admin Login - Loyalty CRM',
    description: 'Secure login for platform administrators',
}

export default function SuperAdminLoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Admin</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Secure access for platform administrators only
                        </p>
                    </div>

                    <SuperAdminLoginForm />

                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        <p>Not a platform admin?</p>
                        <Link href="/en/staff/login" className="text-blue-600 hover:text-blue-800 font-medium">
                            Staff Login →
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    This page is for platform administrators only. Unauthorized access attempts are logged.
                </p>
            </div>
        </div>
    )
}
