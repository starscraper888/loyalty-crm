'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    try {
        const supabase = await createClient()

        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error.message }
        }

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            revalidatePath('/', 'layout')

            if (profile && ['admin', 'owner', 'manager'].includes(profile.role)) {
                redirect('/en/admin/dashboard')
            } else {
                redirect('/en/staff/dashboard')
            }
        }

    } catch (error) {
        // Next.js redirects throw an error, so we need to rethrow it
        if ((error as Error).message === 'NEXT_REDIRECT') {
            throw error
        }
        return { error: 'An unexpected error occurred' }
    }

    // Fallback if no user (shouldn't happen if no error)
    return { error: 'Login failed' }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/en')
}
