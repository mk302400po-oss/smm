'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

type Order = {
    id: string
    service_id: string | null
    link: string
    quantity: number
    total_price: number
    status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'canceled' | 'refunded'
    start_count: number
    current_count: number
    created_at: string
    provider_order_id?: string | null
    services?: {
        name: string
        platform: string
    }
}

export default function OrdersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [dataLoading, setDataLoading] = useState(true)
    const [cancelingOrder, setCancelingOrder] = useState<string | null>(null)
    const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchOrders()
            // Auto-refresh orders every 30 seconds
            const interval = setInterval(() => {
                refreshOrderStatuses()
            }, 30000)
            return () => clearInterval(interval)
        }
    }, [user])

    useEffect(() => {
        filterOrders()
    }, [orders, statusFilter, searchTerm])

    const fetchOrders = async () => {
        if (!user) return

        const { data } = await supabase
            .from('orders')
            .select(`
        *,
        services (
          name,
          platform
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setOrders(data)
        }
        setDataLoading(false)
    }

    const refreshOrderStatuses = async () => {
        if (!user) return

        const activeOrders = orders.filter(o =>
            o.status === 'pending' || o.status === 'processing' || o.status === 'in_progress'
        )

        for (const order of activeOrders) {
            try {
                const res = await fetch(`/api/orders/${order.id}/status`)
                if (res.ok) {
                    const statusData = await res.json()
                    // Update order in state if status changed
                    setOrders(prev => prev.map(o =>
                        o.id === order.id
                            ? { ...o, status: statusData.status, current_count: statusData.current_count }
                            : o
                    ))
                }
            } catch (error) {
                console.error('Failed to refresh order status:', error)
            }
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        setCancelingOrder(orderId)
        setShowCancelDialog(null)

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()

            if (res.ok) {
                // Update order in state
                setOrders(prev => prev.map(o =>
                    o.id === orderId ? { ...o, status: 'canceled' } : o
                ))

                // Show success message (you can add a toast notification here)
                alert(`تم إلغاء الطلب واسترداد ${data.refunded?.toFixed(2)} ر.س`)
            } else {
                alert(data.error || 'فشل إلغاء الطلب')
            }
        } catch (error) {
            console.error('Cancel order error:', error)
            alert('حدث خطأ أثناء إلغاء الطلب')
        } finally {
            setCancelingOrder(null)
        }
    }

    const filterOrders = () => {
        let filtered = orders

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.services?.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredOrders(filtered)
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

    const getProgressPercentage = (order: Order) => {
        if (order.status === 'completed') return 100
        if (order.status === 'canceled' || order.status === 'refunded') return 0
        if (order.start_count === 0 || order.quantity === 0) return 0
        return Math.min(100, Math.round(((order.current_count - order.start_count) / order.quantity) * 100))
    }

    const canCancelOrder = (order: Order) => {
        return order.status === 'pending' || order.status === 'processing' || order.status === 'in_progress'
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground">طلباتي</h1>
                    <p className="text-muted-foreground">تتبع حالة جميع طلباتك</p>
                </div>
                <Button onClick={() => router.push('/new-order')} className="font-bold px-6 py-4 rounded-xl shadow-sm">
                    + طلب جديد
                </Button>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 md:max-w-xs">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Input
                            placeholder="البحث في الطلبات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('all')}
                            size="sm"
                            className={statusFilter === 'all' ? 'bg-primary text-primary-foreground border-transparent' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}
                        >
                            الكل
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('pending')}
                            size="sm"
                            className={statusFilter === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}
                        >
                            قيد الانتظار
                        </Button>
                        <Button
                            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('in_progress')}
                            size="sm"
                            className={statusFilter === 'in_progress' ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/50' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}
                        >
                            قيد التنفيذ
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('completed')}
                            size="sm"
                            className={statusFilter === 'completed' ? 'bg-success/20 text-success border-success/50' : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'}
                        >
                            مكتمل
                        </Button>
                    </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-muted-foreground mb-4">لا توجد طلبات</p>
                        <Button onClick={() => router.push('/new-order')} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                            ابدأ أول طلب
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="bg-background rounded-xl border border-border p-4 hover:border-primary/30 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center border border-border text-xs font-bold text-muted-foreground">
                                                {order.services?.platform?.charAt(0).toUpperCase() || 'S'}
                                            </div>
                                            <h3 className="font-bold text-foreground">{order.services?.name || 'خدمة'}</h3>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate font-mono bg-accent p-1 rounded px-2 inline-block max-w-full">{order.link}</p>
                                        <div className="flex flex-wrap gap-4 text-sm mt-2">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                الكمية: <span className="text-foreground font-medium">{order.quantity}</span>
                                            </span>
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                التكلفة: <span className="text-foreground font-medium">{formatCurrency(order.total_price)}</span>
                                            </span>
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatRelativeTime(order.created_at)}
                                            </span>
                                            {order.provider_order_id && (
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                    </svg>
                                                    رقم الطلب: <span className="text-primary font-medium font-mono">{order.provider_order_id}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {(order.status === 'in_progress' || order.status === 'processing') && (
                                            <div className="space-y-1 mt-4">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>التقدم</span>
                                                    <span>{getProgressPercentage(order)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500 shadow-sm"
                                                        style={{ width: `${getProgressPercentage(order)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cancel Button */}
                                    {canCancelOrder(order) && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowCancelDialog(order.id)}
                                                disabled={cancelingOrder === order.id}
                                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                                            >
                                                {cancelingOrder === order.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                                        جاري الإلغاء...
                                                    </span>
                                                ) : (
                                                    'إلغاء الطلب'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Cancel Confirmation Dialog */}
                                {showCancelDialog === order.id && (
                                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <div className="bg-card border border-border shadow-sm rounded-xl p-6 max-w-md w-full">
                                            <h3 className="text-xl font-bold text-foreground mb-2">تأكيد إلغاء الطلب</h3>
                                            <p className="text-muted-foreground mb-6">
                                                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم استرداد المبلغ ({formatCurrency(order.total_price)}) إلى رصيدك.
                                            </p>
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                >
                                                    نعم، إلغاء الطلب
                                                </Button>
                                                <Button
                                                    onClick={() => setShowCancelDialog(null)}
                                                    variant="outline"
                                                    className="flex-1 border-border"
                                                >
                                                    لا، الرجوع
                                                </Button>
                                            </div>
                                        </div>
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
