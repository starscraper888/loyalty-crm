import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function verifyStaffPIN(userId: string, pin: string) {
    const supabase = await createClient()

    // Hash the provided PIN
    const pinHash = createHash('sha256').update(pin).digest('hex')

    const { data, error } = await supabase
        .rpc('verify_staff_pin', {
            p_profile_id: userId,
            p_pin_hash: pinHash
        })

    if (error) {
        console.error('PIN verification failed:', error)
        return false
    }

    return data // true/false
}
