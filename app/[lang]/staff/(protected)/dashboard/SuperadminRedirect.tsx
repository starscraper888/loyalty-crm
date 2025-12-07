'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SuperadminRedirect() {
    const router = useRouter()

    useEffect(() => {
        const checkAndRedirect = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            // Check if platform admin
            const { data, error } = await supabase
                .rpc('is_platform_admin', { user_id: user.id })

            if (!error && data === true) {
                // Immediate redirect for superadmins
                router.replace('/en/superadmin')
            }
        }

        checkAndRedirect()
    }, [router])

    return null
}
