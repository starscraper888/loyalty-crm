import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { generateAllTenantQRCodes } from '@/lib/qr/generator'
import TenantQRCode from '@/components/admin/TenantQRCode'
import { QrCode, Download, Printer } from 'lucide-react'

export default async function QRCodesPage() {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check admin/owner role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'owner', 'manager'].includes(profile.role)) {
        redirect('/dashboard')
    }

    // Fetch all tenants
    const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name')

    if (error || !tenants) {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">
                        Failed to load tenants: {error?.message}
                    </p>
                </div>
            </div>
        )
    }

    // Generate QR codes for all tenants
    const qrCodes = await generateAllTenantQRCodes(tenants)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Tenant QR Codes
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Generate and download WhatsApp QR codes for member registration
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                        How to Use These QR Codes
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                        <div>
                            <strong className="block mb-1">For Print Materials:</strong>
                            <ol className="ml-4 list-decimal space-y-1">
                                <li>Click "Print" on the QR code</li>
                                <li>Print on flyers, posters, or table tents</li>
                                <li>Place at checkout counter or entrance</li>
                            </ol>
                        </div>
                        <div>
                            <strong className="block mb-1">For Digital Use:</strong>
                            <ol className="ml-4 list-decimal space-y-1">
                                <li>Click "Download PNG"</li>
                                <li>Share on social media or website</li>
                                <li>Include in email campaigns</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Tenants</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{tenants.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">WhatsApp Number</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">+1 415 523 8886</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">QR Codes Generated</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{qrCodes.length}</div>
                    </div>
                </div>

                {/* QR Codes Grid */}
                {qrCodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {qrCodes.map(({ tenant, qrCodeUrl }) => (
                            <TenantQRCode
                                key={tenant.id}
                                tenant={tenant}
                                qrCodeUrl={qrCodeUrl}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                        <QrCode className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                        <p className="text-yellow-800 dark:text-yellow-200">
                            No tenants found. Create a tenant first to generate QR codes.
                        </p>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">💡 Pro Tips</h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Print QR codes at 300 DPI or higher for best scan quality</li>
                        <li>• Test QR codes before printing large batches</li>
                        <li>• Include brief instructions near QR code ("Scan to Join")</li>
                        <li>• Place QR codes at eye level for easy scanning</li>
                        <li>• Consider laminating printed QR codes for durability</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
