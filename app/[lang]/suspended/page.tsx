import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Ban, AlertTriangle } from 'lucide-react'

export default async function SuspendedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/en')
    }

    // Get tenant info
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/en')
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, status, suspension_reason, suspended_at')
        .eq('id', profile.tenant_id)
        .single()

    // If not suspended, redirect to dashboard
    if (tenant?.status !== 'suspended') {
        redirect('/en/admin/dashboard')
    }

    // Keep user signed in so they can access billing to resolve payment issues
    // await supabase.auth.signOut()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
                        <Ban className="w-10 h-10 text-red-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Account Suspended
                    </h1>

                    {/* Message */}
                    <p className="text-lg text-slate-300 mb-6">
                        Your account <span className="font-semibold text-white">{tenant?.name}</span> has been suspended.
                    </p>

                    {/* Reason */}
                    {tenant?.suspension_reason && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <h3 className="font-semibold text-red-400 mb-1">Reason for Suspension:</h3>
                                    <p className="text-slate-300">{tenant.suspension_reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suspended Date */}
                    {tenant?.suspended_at && (
                        <p className="text-sm text-slate-500 mb-8">
                            Suspended on {new Date(tenant.suspended_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    )}

                    {/* Instructions */}
                    <div className="bg-slate-700/50 rounded-lg p-6 text-left mb-6">
                        <h3 className="font-semibold text-white mb-3">What happens now?</h3>
                        <ul className="space-y-2 text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>All access to your account has been temporarily disabled</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>Your data remains secure and intact</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400">•</span>
                                <span>Staff and members cannot access the system</span>
                            </li>
                        </ul>
                    </div>

                    {/* Update Payment Method */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-blue-400 mb-3">💳 Resolve Payment Issues</h3>
                        <p className="text-slate-300 mb-4">
                            If your account was suspended due to payment issues, you can update your billing information to restore access.
                        </p>
                        <a
                            href="/en/settings/billing"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Manage Billing & Payments
                        </a>
                    </div>

                    {/* Contact Support */}
                    <div className="border-t border-slate-700 pt-6">
                        <h3 className="font-semibold text-white mb-3">Need help?</h3>
                        <p className="text-slate-400 mb-4">
                            If you believe this is a mistake or would like to discuss reactivating your account, please contact our support team.
                        </p>
                        <a
                            href="mailto:support@loyaltycrm.com"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 space-y-3">
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </form>
                    <div>
                        <a
                            href="/en"
                            className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            ← Return to Homepage
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
