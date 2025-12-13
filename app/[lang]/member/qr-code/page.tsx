import { generateMyOTP } from '@/app/member/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MemberQRCodeClient from './MemberQRCodeClient'

export default async function MemberQRCodePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    return <MemberQRCodeClient tenantId={profile.tenant_id} />
}
