import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'bm' | 'zh' }> }) {
    const { lang } = await params
    const dict = await getDictionary(lang)

    return (
        <main className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white">
            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                Loyalty CRM
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/${lang}/staff/login`}
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                {dict.landing.nav.business_login}
                            </Link>
                            <Link
                                href="/onboarding"
                                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
                            >
                                {dict.landing.nav.get_started}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-32">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-300 text-xs font-medium mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        {dict.landing.hero.badge}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                        {dict.landing.hero.title} <br />
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                            {dict.landing.hero.title_highlight}
                        </span>
                    </h1>

                    <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        {dict.landing.hero.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/onboarding"
                            className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
                        >
                            {dict.landing.hero.cta_trial}
                        </Link>
                        <Link
                            href={`/${lang}/staff/login`}
                            className="w-full sm:w-auto px-8 py-4 text-lg font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl transition-all hover:-translate-y-1"
                        >
                            {dict.landing.hero.cta_login}
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            {dict.landing.hero.trial_feature}
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            {dict.landing.hero.cancel_feature}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-slate-800/50 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{dict.landing.features.points_title}</h3>
                            <p className="text-slate-400">{dict.landing.features.points_desc}</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-indigo-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{dict.landing.features.portal_title}</h3>
                            <p className="text-slate-400">{dict.landing.features.portal_desc}</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-cyan-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{dict.landing.features.analytics_title}</h3>
                            <p className="text-slate-400">{dict.landing.features.analytics_desc}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-800 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Loyalty CRM. {dict.landing.footer.copyright}</p>
                <div className="mt-4 flex justify-center gap-6">
                    <Link href={`/en`} className="hover:text-blue-400 transition-colors">{dict.landing.footer.lang_en}</Link>
                    <Link href={`/bm`} className="hover:text-blue-400 transition-colors">{dict.landing.footer.lang_bm}</Link>
                    <Link href={`/zh`} className="hover:text-blue-400 transition-colors">{dict.landing.footer.lang_zh}</Link>
                </div>
            </footer>
        </main>
    )
}
