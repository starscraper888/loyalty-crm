'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/auth/actions'
import { useState } from 'react'
import {
    Menu,
    X,
    LayoutDashboard,
    Gift,
    Users,
    Megaphone,
    TrendingUp,
    Settings,
    QrCode,
    CreditCard,
    LogOut,
    User,
    ChevronDown
} from 'lucide-react'

export default function AdminNavbar({ email, role, isPlatformAdmin }: { email?: string, role?: string, isPlatformAdmin?: boolean }) {
    const pathname = usePathname()
    const lang = pathname.split('/')[1] || 'en'
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    const isActive = (path: string) => pathname.startsWith(`/${lang}${path}`)

    const isManager = role === 'manager'

    const navItems = [
        { href: `/${lang}/admin/dashboard`, label: 'Dashboard', icon: LayoutDashboard, show: true },
        { href: `/${lang}/admin/rewards`, label: 'Rewards', icon: Gift, show: true },
        { href: `/${lang}/admin/members`, label: 'Members', icon: Users, show: true },
        { href: `/${lang}/admin/campaigns`, label: 'Campaigns', icon: Megaphone, show: !isManager },
        { href: `/${lang}/admin/analytics`, label: 'Analytics', icon: TrendingUp, show: true },
    ]

    return (
        <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={`/${lang}/admin/dashboard`} className="flex items-center gap-3 group">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-lg font-bold text-white">Loyalty Admin</div>
                                <div className="text-xs text-slate-400">Management Portal</div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.filter(item => item.show).map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )
                        })}

                        {/* Settings Dropdown */}
                        <div className="relative group ml-2">
                            <button
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive('/admin/qr-codes') || isActive('/settings/billing')
                                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                <Settings className="h-4 w-4" />
                                <span className="text-sm font-medium">More</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                                <Link
                                    href={`/${lang}/admin/qr-codes`}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <QrCode className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">QR Codes</div>
                                        <div className="text-xs text-slate-400">Generate & manage</div>
                                    </div>
                                </Link>
                                <Link
                                    href={`/${lang}/settings/billing`}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                        <CreditCard className="h-4 w-4 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Billing</div>
                                        <div className="text-xs text-slate-400">Subscription & Credits</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="hidden md:flex items-center gap-3">
                        {isPlatformAdmin && (
                            <Link
                                href={`/${lang}/superadmin`}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-300 hover:from-purple-600/30 hover:to-blue-600/30 transition-all"
                            >
                                Platform Admin
                            </Link>
                        )}

                        <Link
                            href={`/${lang}/staff/dashboard`}
                            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white font-medium transition-colors"
                        >
                            Staff View →
                        </Link>

                        {/* User Menu */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>

                            <div className="absolute top-full right-0 mt-2 w-60 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                                <div className="px-4 py-3 border-b border-slate-700/50">
                                    <div className="text-xs text-slate-400 mb-1">Signed in as</div>
                                    <div className="text-sm font-medium text-white truncate">{email}</div>
                                </div>
                                <form action={logout}>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/10 transition-colors text-left">
                                        <LogOut className="h-4 w-4 text-red-400" />
                                        <span className="text-sm font-medium text-red-400">Logout</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-md">
                    <div className="px-4 py-4 space-y-1">
                        {navItems.filter(item => item.show).map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )
                        })}

                        <div className="pt-2 mt-2 border-t border-slate-700/50">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2">
                                Settings
                            </div>
                            <Link
                                href={`/${lang}/admin/qr-codes`}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="p-2 bg-cyan-500/10 rounded-lg">
                                    <QrCode className="h-4 w-4 text-cyan-400" />
                                </div>
                                <span className="text-sm font-medium">QR Codes</span>
                            </Link>
                            <Link
                                href={`/${lang}/settings/billing`}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <CreditCard className="h-4 w-4 text-green-400" />
                                </div>
                                <span className="text-sm font-medium">Billing</span>
                            </Link>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-700/50">
                            <div className="px-4 py-2">
                                <div className="text-xs text-slate-400 mb-1">Signed in as</div>
                                <div className="text-sm font-medium text-white truncate mb-3">{email}</div>
                            </div>
                            {isPlatformAdmin && (
                                <Link
                                    href={`/${lang}/superadmin`}
                                    className="block px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Platform Admin
                                </Link>
                            )}
                            <Link
                                href={`/${lang}/staff/dashboard`}
                                className="block px-4 py-2 text-sm font-medium text-blue-300 hover:text-blue-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Staff View →
                            </Link>
                            <form action={logout}>
                                <button className="w-full text-left px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
