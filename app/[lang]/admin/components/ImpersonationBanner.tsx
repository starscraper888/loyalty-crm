'use client'

import { useEffect, useState } from 'react'
import { LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ImpersonationBanner() {
    const [isImpersonating, setIsImpersonating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Check for impersonation cookie
        const impersonationMode = document.cookie
            .split('; ')
            .find(row => row.startsWith('impersonation_mode='))
            ?.split('=')[1]

        setIsImpersonating(impersonationMode === 'true')
    }, [])

    const handleExitImpersonation = async () => {
        // Clear impersonation cookie
        document.cookie = 'impersonation_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

        // Sign out and redirect to superadmin dashboard
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/en/superadmin')
    }

    if (!isImpersonating) return null

    return (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 shadow-lg z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5" />
                    <div>
                        <p className="font-semibold">Platform Admin Mode</p>
                        <p className="text-xs opacity-90">You are viewing this tenant account as a platform administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleExitImpersonation}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Exit & Return to Platform Admin
                </button>
            </div>
        </div>
    )
}
