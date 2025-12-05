'use client'

import { useActionState } from 'react'
import { login } from '@/app/auth/actions'

const initialState = {
    error: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Staff Login</h1>

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {state?.error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}
