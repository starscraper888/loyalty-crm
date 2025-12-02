import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'bm' | 'zh' }> }) {
    const { lang } = await params
    const dict = await getDictionary(lang)

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    {dict.welcome}
                </h1>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-2">{dict.points}</h2>
                    <p className="text-gray-600 dark:text-gray-300">0</p>
                </div>

                <Link href={`/${lang}/redeem`} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center">
                    {dict.redeem}
                </Link>

                <Link href={`/${lang}/staff/login`} className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center">
                    {dict.login}
                </Link>
            </div>

            <div className="mt-12 flex gap-4">
                <a href="/en" className="text-blue-500 hover:underline">English</a>
                <a href="/bm" className="text-blue-500 hover:underline">Bahasa Melayu</a>
                <a href="/zh" className="text-blue-500 hover:underline">中文</a>
            </div>
        </main>
    )
}
