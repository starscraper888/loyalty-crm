'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    try {
        const supabase = await createClient()

        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error.message }
        }
    } catch (error) {
        // Next.js redirects throw an error, so we need to rethrow it
        if ((error as Error).message === 'NEXT_REDIRECT') {
            throw error
        }
        return { error: 'An unexpected error occurred' }
    }

    revalidatePath('/', 'layout')
    redirect('/en/staff/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/en')
}
