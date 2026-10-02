// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

type Order = {
    id: string
    user_id: string
    service_id: string
    link: string
    quantity: number
    total_price: number
    status: string
    provider_order_id: string | null
    created_at: string
    users: {
        email: string
    } | null
    services: {
        name: string
        platform: string
    } | null
}

export default function AdminOrdersPage() {
    const { user, loading } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const supabase = createClient()

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchOrders()
        }
    }, [user])

    const fetchOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    users (
                        email
                    ),
                    services (
                        name,
                        platform
                    )
                `)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) throw error
            setOrders(data as Order[])
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)

            if (error) throw error

            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
        } catch (error) {
            console.error('Error updating status:', error)
            alert('حدث خطأ أثناء تحديث الحالة')
        }
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { className: string, label: string, icon: string }> = {
            pending: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'قيد الانتظار', icon: '⏳' },
            processing: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'قيد المعالجة', icon: '🔄' },
            in_progress: { className: 'bg-primary/20 text-primary border-primary/30', label: 'جاري التنفيذ', icon: '⚙️' },
            completed: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'مكتمل', icon: '✅' },
            canceled: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'ملغي', icon: '❌' },
            refunded: { className: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'مُسترد', icon: '💰' }
        }

        const statusConfig = config[status] || config.pending
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.className}`}>
                {statusConfig.icon} {statusConfig.label}
            </span>
        )
    }

    useEffect(() => {
        fetchOrders()
    }, [filter])

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-red-500">الوصول مرفوض</h1>
            </div>
        )
    }

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'completed').length
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">إدارة الطلبات 📦</h1>
                    <p className="text-muted-foreground mt-2">عرض وإدارة جميع الطلبات</p>
                </div>
                <Link href="/admin" className="bg-primary text-primary-foreground rounded-xl shadow-sm px-6 py-3 font-semibold hover:opacity-90">
                    ← عودة للوحة التحكم
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-muted-foreground mt-2">إجمالي الطلبات</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-warning dark:text-yellow-500 text-yellow-600">{stats.pending}</p>
                    <p className="text-muted-foreground mt-2">قيد الانتظار</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-primary">{stats.processing}</p>
                    <p className="text-muted-foreground mt-2">قيد المعالجة</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-success">{stats.completed}</p>
                    <p className="text-muted-foreground mt-2">مكتملة</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border shadow-sm rounded-xl p-4">
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'processing', 'in_progress', 'completed', 'canceled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium ${filter === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border border-border text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {status === 'all' ? 'الكل' : getStatusBadge(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">الطلبات</h2>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">لا توجد طلبات</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-background border border-border shadow-sm rounded-xl p-6 hover:scale-[1.01] transition-transform">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-foreground">{order.users?.email || 'Unknown'}</h3>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            🎯 {order.services?.name || 'خدمة محذوفة'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            🔗 {order.link}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            📊 الكمية: {order.quantity.toLocaleString()} • {formatRelativeTime(order.created_at)}
                                        </p>
                                        {order.provider_order_id && (
                                            <p className="text-xs text-primary mt-1">
                                                Provider Order ID: {order.provider_order_id}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-success">{formatCurrency(order.total_price)}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {order.status === 'pending' && (
                                    <div className="flex gap-2 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'processing')}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                                        >
                                            🔄 ابدأ المعالجة
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'completed')}
                                            className="px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors font-medium"
                                        >
                                            ✅ مكتمل
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'canceled')}
                                            className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors font-medium"
                                        >
                                            ❌ إلغاء
                                        </button>
                                    </div>
                                )}

                                {order.status === 'processing' && (
                                    <div className="flex gap-2 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'in_progress')}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                                        >
                                            ⚙️ جاري التنفيذ
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'completed')}
                                            className="px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors font-medium"
                                        >
                                            ✅ مكتمل
                                        </button>
                                    </div>
                                )}

                                {order.status === 'in_progress' && (
                                    <div className="flex gap-2 pt-4 border-t border-border">
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'completed')}
                                            className="px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors font-medium"
                                        >
                                            ✅ مكتمل
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
