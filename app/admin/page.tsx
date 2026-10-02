// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCurrency, formatRelativeTime, displayAsEGP } from '@/lib/utils/format'

type Transaction = {
    id: string
    user_id: string
    type: string
    amount: number
    status: string
    created_at: string
    users: {
        email: string
    } | null
}

export default function AdminPage() {
    const { user, loading } = useAuth()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingDeposits: 0,
        providerBalance: null as number | null
    })
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchDashboardData()
        }
    }, [user])

    const fetchDashboardData = async () => {
        try {
            // Fetch total users
            const { count: usersCount } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })

            // Fetch total orders
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })

            // Fetch total revenue (sum of completed deposits)
            const { data: revenue } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'deposit')
                .eq('status', 'completed')

            const totalRevenue = revenue?.reduce((sum, t) => sum + t.amount, 0) || 0

            // Fetch pending deposits count
            const { count: pendingCount } = await supabase
                .from('deposit_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending')

            setStats({
                totalUsers: usersCount || 0,
                totalOrders: ordersCount || 0,
                totalRevenue: totalRevenue,
                pendingDeposits: pendingCount || 0,
                providerBalance: null // Initial state
            })

            // Fetch Provider Balance (non-blocking)
            fetch('/api/admin/provider-balance')
                .then(res => res.json())
                .then(data => {
                    if (data && data.balance) {
                        setStats(prev => ({ ...prev, providerBalance: parseFloat(data.balance) }))
                    }
                })
                .catch(err => console.error('Failed to fetch provider balance:', err))

            // Fetch recent transactions
            const { data: transactions } = await supabase
                .from('transactions')
                .select(`
                    *,
                    users (
                        email
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentTransactions(transactions as Transaction[] || [])
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { className: string, label: string, icon: string }> = {
            pending: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'قيد الانتظار', icon: '⏳' },
            completed: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'تمت', icon: '✅' },
            failed: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'مرفوض', icon: '❌' },
            processing: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'قيد التقدم', icon: '🔄' }
        }

        const config = statusConfig[status] || statusConfig.pending
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.className}`}>
                {config.icon} {config.label}
            </span>
        )
    }

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-red-500 mb-4">⚠️ غير مسجل دخول</h1>
                <p className="text-gray-400">يرجى تسجيل الدخول للمتابعة</p>
            </div>
        )
    }

    if (user.role !== 'admin') {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-yellow-500 mb-4">🔒 الوصول مرفوض</h1>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 max-w-md mx-auto text-right">
                    <p className="mb-2"><span className="text-gray-400">البريد الإلكتروني:</span> <span className="font-mono text-white">{user.email}</span></p>
                    <p className="mb-2"><span className="text-gray-400">صلاحيتك:</span> <span className="font-bold text-yellow-400">{user.role}</span></p>
                    <p><span className="text-gray-400">المطلوب:</span> <span className="font-bold text-green-400">admin</span></p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-card border-l-4 border-l-primary shadow-sm rounded-xl p-6">
                <h1 className="text-3xl font-bold text-foreground">
                    لوحة تحكم الأدمن ⚙️
                </h1>
                <p className="text-muted-foreground mt-2">إدارة المنصة والمستخدمين والطلبات</p>
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">مرحباً،</span>
                    <span className="text-sm font-mono text-primary">{user.email}</span>
                    <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full">Admin</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                            <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.totalUsers}</h3>
                        </div>
                        <div className="text-5xl">👥</div>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                            <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.totalOrders}</h3>
                        </div>
                        <div className="text-5xl">📦</div>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                            <h3 className="text-3xl font-bold mt-2 text-foreground">{displayAsEGP(stats.totalRevenue)}</h3>
                            <p className="text-xs text-muted-foreground mt-1">({formatCurrency(stats.totalRevenue)})</p>
                        </div>
                        <div className="text-5xl">💰</div>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                            <h3 className="text-3xl font-bold mt-2 text-foreground">{stats.pendingDeposits}</h3>
                        </div>
                        <div className="text-5xl">⏳</div>
                    </div>
                </div>

                <div className="bg-card border border-border shadow-sm rounded-xl p-6 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">رصيد السيرفر الأساسي</p>
                            <h3 className="text-3xl font-bold mt-2 text-foreground">
                                {stats.providerBalance !== null ? formatCurrency(stats.providerBalance) : '...'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">المتبقي في XFollowr</p>
                        </div>
                        <div className="text-5xl">🏦</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">إجراءات سريعة</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin/orders" className="bg-primary text-primary-foreground rounded-xl shadow-sm p-6 text-right hover:scale-105 transition-transform block">
                        <div className="text-2xl mb-2">📦</div>
                        <div className="text-lg font-semibold">إدارة الطلبات</div>
                        <div className="text-sm opacity-90">عرض وتحديث حالة الطلبات</div>
                    </Link>
                    <Link href="/admin/services" className="bg-primary text-primary-foreground rounded-xl shadow-sm p-6 text-right hover:scale-105 transition-transform block">
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-lg font-semibold">إدارة الخدمات</div>
                        <div className="text-sm opacity-90">إضافة وتعديل الخدمات المتاحة</div>
                    </Link>
                    <Link href="/admin/users" className="bg-primary text-primary-foreground rounded-xl shadow-sm p-6 text-right hover:scale-105 transition-transform block">
                        <div className="text-2xl mb-2">👤</div>
                        <div className="text-lg font-semibold">إدارة المستخدمين</div>
                        <div className="text-sm opacity-90">عرض وإدارة حسابات المستخدمين</div>
                    </Link>
                    <Link href="/admin/deposits" className="bg-primary text-primary-foreground rounded-xl shadow-sm p-6 text-right hover:scale-105 transition-transform block">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="text-lg font-semibold">طلبات الإيداع</div>
                        <div className="text-sm opacity-90">مراجعة والموافقة على الإيداعات</div>
                    </Link>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">آخر العمليات</h2>
                {recentTransactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-lg">لا توجد عمليات حالياً</p>
                        <p className="text-sm opacity-70 mt-2">ستظهر العمليات الأخيرة هنا</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentTransactions.map(transaction => (
                            <div key={transaction.id} className="bg-background border border-border shadow-sm rounded-xl p-4 hover:bg-accent transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">
                                            {transaction.type === 'deposit' ? '💰' : '🛒'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{transaction.users?.email || 'مستخدم'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.type === 'deposit' ? 'طلب إيداع' : 'طلب خدمة'} • {formatRelativeTime(transaction.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-success">{formatCurrency(transaction.amount)}</p>
                                        </div>
                                        {getStatusBadge(transaction.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
