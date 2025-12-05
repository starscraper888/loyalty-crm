import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'bm' | 'zh' }> }) {
    const { lang } = await params
    const dict = await getDictionary(lang)

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Loyalty CRM
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Staff & Admin Portal
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="mb-6 text-gray-600 dark:text-gray-300">
                        Please log in to manage points, redemptions, and members.
                    </p>

                    <Link
                        href={`/${lang}/staff/login`}
                        className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        {dict.login}
                    </Link>
                </div>

                <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <a href="/en" className="hover:text-blue-500 hover:underline transition">English</a>
                    <a href="/bm" className="hover:text-blue-500 hover:underline transition">Bahasa Melayu</a>
                    <a href="/zh" className="hover:text-blue-500 hover:underline transition">中文</a>
                </div>
            </div>
        </main>
    )
}
