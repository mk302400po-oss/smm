'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, signOut, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login')
            } else if (user.role !== 'admin') {
                router.push('/dashboard')
            }
        }
    }, [user, loading, router])

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const adminNavItems = [
        {
            href: '/admin', label: 'الرئيسية', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            href: '/admin/orders', label: 'الطلبات', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            href: '/admin/services', label: 'الخدمات', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            )
        },
        {
            href: '/admin/users', label: 'المستخدمين', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            href: '/admin/deposits', label: 'الإيداعات', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        }
    ]

    return (
        <div className="min-h-screen bg-zinc-950 text-foreground relative overflow-hidden" dir="rtl">
            {/* Admin Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 shadow-sm' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="flex items-center gap-3 group">
                                <img
                                    src="/logo.png"
                                    alt="Venom Media Admin"
                                    className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                            </Link>
                            <div className="hidden sm:block border-r border-zinc-700 pr-4">
                                <h1 className="text-xl font-bold text-white tracking-wide">لوحة الإدارة</h1>
                                <p className="text-xs text-zinc-400">نظام التحكم الشامل</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1 bg-zinc-900 rounded-full p-1 border border-zinc-800 backdrop-blur-md">
                            {adminNavItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                )
                            })}
                            <div className="h-6 w-px bg-zinc-700 mx-2"></div>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-emerald-400 hover:bg-emerald-400/10 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                عودة للموقع
                            </Link>
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut()}
                                className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation (Bottom Bar) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-50 pb-safe">
                <div className="flex justify-around items-center p-2">
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive
                                    ? 'text-indigo-400 bg-indigo-500/10'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12 relative z-10 min-h-screen">
                {children}
            </main>
        </div>
    )
}
