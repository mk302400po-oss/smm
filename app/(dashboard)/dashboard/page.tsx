// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime, displayAsEGP } from '@/lib/utils/format'

type Order = {
    id: string
    service_id: string | null
    link: string
    quantity: number
    total_price: number
    status: string
    created_at: string
}

type Stats = {
    totalOrders: number
    pendingOrders: number
    completedOrders: number
}

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, completedOrders: 0 })
    const [recentOrders, setRecentOrders] = useState<Order[]>([])
    const [dataLoading, setDataLoading] = useState(true)
    const [balance, setBalance] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchDashboardData()
            fetchBalance()
        }
    }, [user])

    const fetchBalance = async () => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('users')
                .select('balance')
                .eq('id', user.id)
                .single()

            if (data && !error) {
                setBalance(data.balance || 0)
                console.log('💰 Balance loaded:', data.balance)
            }
        } catch (err) {
            console.error('Error fetching balance:', err)
        }
    }

    const fetchDashboardData = async () => {
        if (!user) return

        // Fetch orders
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        const orders = (data || []) as Order[]

        if (orders.length > 0) {
            setRecentOrders(orders)

            // Calculate stats
            const totalOrders = orders.length
            const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
            const completedOrders = orders.filter(o => o.status === 'completed').length

            setStats({ totalOrders, pendingOrders, completedOrders })
        }

        setDataLoading(false)
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, any> = {
            pending: { variant: 'pending', label: 'قيد الانتظار', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
            processing: { variant: 'processing', label: 'قيد المعالجة', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            in_progress: { variant: 'processing', label: 'قيد التنفيذ', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
            completed: { variant: 'completed', label: 'مكتمل', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
            canceled: { variant: 'canceled', label: 'ملغي', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
            refunded: { variant: 'canceled', label: 'مسترد', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
        }
        const config = statusMap[status] || { variant: 'default', label: status, className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
        return <Badge variant="outline" className={`${config.className} border`}>{config.label}</Badge>
    }

    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground mb-2">
                        مرحباً، <span className="text-primary">{user?.full_name?.split(' ')[0] || 'صديقي'}</span> 👋
                    </h1>
                    <p className="text-muted-foreground">إليك نظرة عامة على حسابك ونشاطك الأخير</p>
                </div>
                <Button onClick={() => router.push('/new-order')} className="font-semibold px-8 py-6 rounded-xl shadow-sm">
                    + طلب جديد
                </Button>
            </div>

            {/* Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-card border border-border shadow-sm rounded-xl p-8 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <p className="text-muted-foreground mb-2 font-medium">الرصيد الحالي</p>
                                <h2 className="text-5xl font-black text-foreground tracking-tight">
                                    {displayAsEGP(balance)}
                                </h2>
                                <p className="text-sm text-muted-foreground font-medium mb-4">
                                    ({formatCurrency(balance)})
                                </p>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
                                        نشط
                                    </Badge>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                        حساب موثق
                                    </Badge>
                                </div>
                            </div>
                            <Button asChild variant="secondary" size="lg" className="font-semibold px-8 py-6 rounded-xl w-full md:w-auto">
                                <Link href="/add-funds">شحن الرصيد</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center hover:bg-accent transition-colors">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{stats.totalOrders}</p>
                        <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                    </div>
                    <div className="bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center hover:bg-accent transition-colors">
                        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{stats.pendingOrders}</p>
                        <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
                    </div>
                    <div className="bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col justify-center items-center text-center hover:bg-accent transition-colors col-span-2">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{stats.completedOrders}</p>
                        <p className="text-xs text-muted-foreground">طلبات مكتملة</p>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">آخر الطلبات</h3>
                    <Link href="/orders" className="text-sm text-primary hover:text-primary/80 transition-colors">
                        عرض الكل &larr;
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-muted-foreground mb-4">لا توجد طلبات بعد</p>
                        <Button onClick={() => router.push('/new-order')} variant="outline">
                            ابدأ أول طلب
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                                        <span className="text-xs font-bold text-muted-foreground">ID</span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground truncate max-w-[150px] md:max-w-xs">{order.link}</p>
                                        <p className="text-xs text-muted-foreground">الكمية: {order.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="font-bold text-foreground">{formatCurrency(order.total_price)}</p>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(order.status)}
                                        <span className="text-[10px] text-muted-foreground hidden md:inline-block">{formatRelativeTime(order.created_at)}</span>
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
