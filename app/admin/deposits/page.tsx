// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { formatCurrency, EXCHANGE_RATES, updateExchangeRate } from '@/lib/utils/format'

type Deposit = {
    id: string
    user_id: string
    amount: number
    status: string
    payment_method: string
    sender_phone: string
    created_at: string
    screenshot_url: string | null
    users: {
        email: string
    } | null
}

export default function AdminDepositsPage() {
    const { user, loading } = useAuth()
    const [deposits, setDeposits] = useState<Deposit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
    const [rate, setRate] = useState(EXCHANGE_RATES.USD_TO_EGP)
    const supabase = createClient()

    useEffect(() => {
        updateExchangeRate().then(() => {
            setRate(EXCHANGE_RATES.USD_TO_EGP)
        })
    }, [])

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchDeposits()
        }
    }, [user])

    const fetchDeposits = async () => {
        try {
            const { data, error } = await supabase
                .from('deposit_requests')
                .select(`
                    *,
                    users (
                        email
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setDeposits(data as Deposit[])
        } catch (error) {
            console.error('Error fetching deposits:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            // @ts-expect-error - Supabase type generation issue
            const { error } = await supabase
                .from('deposit_requests')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            // If approved, update user balance
            if (newStatus === 'approved') {
                const deposit = deposits.find(d => d.id === id)
                if (deposit) {
                    const { error: balanceError } = await supabase.rpc('increment_balance', {
                        user_id: deposit.user_id,
                        amount: deposit.amount / EXCHANGE_RATES.USD_TO_EGP
                    })

                    if (balanceError) {
                        console.error('Error updating balance:', balanceError)
                    } else {
                        // Keep legacy systems working by adding to transactions table
                        const { error: txError } = await supabase.from('transactions').insert({
                            user_id: deposit.user_id,
                            amount: deposit.amount / EXCHANGE_RATES.USD_TO_EGP,
                            type: 'deposit',
                            status: 'completed',
                            description: `شحن رصيد عبر ${deposit.payment_method || 'طريقة غير معروفة'}`
                        });
                        if (txError) console.error('Error inserting transaction:', txError);
                    }
                }
            }

            // Update local state
            setDeposits(deposits.map(d =>
                d.id === id ? { ...d, status: newStatus } : d
            ))
            toast.success(newStatus === 'approved' ? 'تم قبول الإيداع وإضافة الرصيد بنجاح' : 'تم رفض الإيداع')
        } catch (error) {
            console.error('Error updating status:', error)
            toast.error('حدث خطأ أثناء تحديث الحالة')
        }
    }

    const getStatusBadge = (status: string) => {
        if (status === 'pending') return 'bg-yellow-500/20 text-yellow-400'
        if (status === 'approved') return 'bg-green-500/20 text-green-400'
        return 'bg-red-500/20 text-red-400'
    }

    const getStatusText = (status: string) => {
        if (status === 'pending') return '⏳ معلق'
        if (status === 'approved') return '✓ مقبول'
        return '✗ مرفوض'
    }

    if (loading || isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    }

    if (!user || user.role !== 'admin') {
        return <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-500">الوصول مرفوض</h1>
        </div>
    }

    return (
        <div className="space-y-6 relative">
            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="bg-card p-4 rounded-xl max-w-2xl w-full border border-border shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-foreground">إيصال الدفع</h3>
                            <button onClick={() => setSelectedReceipt(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                        <div className="aspect-video bg-accent/50 rounded-lg flex items-center justify-center border border-border">
                            <img src={selectedReceipt} alt="Receipt" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setSelectedReceipt(null)} className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors">
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">طلبات الإيداع 💳</h1>
                    <p className="text-muted-foreground mt-2">مراجعة والموافقة على طلبات الإيداع</p>
                </div>
                <Link href="/admin" className="bg-primary text-primary-foreground rounded-xl shadow-sm px-6 py-3 font-semibold hover:opacity-90">
                    ← عودة للوحة التحكم
                </Link>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">جميع الطلبات</h2>

                {deposits.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">لا توجد طلبات إيداع</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deposits.map(deposit => (
                            <div key={deposit.id} className="bg-background border border-border shadow-sm rounded-xl p-6 hover:scale-[1.01] transition-transform">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">{deposit.users?.email || 'Unknown'}</h3>
                                        <p className="text-sm text-muted-foreground">التاريخ: {new Date(deposit.created_at).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-400">{deposit.amount} ج.م</p>
                                        <p className="text-sm font-semibold text-success mt-1">
                                            سيتم إضافة: ${(deposit.amount / rate).toFixed(2)}
                                        </p>
                                        <p className="text-sm font-semibold mt-1 text-primary">طريقة الدفع: {deposit.payment_method}</p>
                                        <p className="text-sm font-semibold text-muted-foreground">الرقم المحول منه: {deposit.sender_phone}</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusBadge(deposit.status)}`}>
                                            {getStatusText(deposit.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-border">
                                    <span className="text-sm text-muted-foreground">إيصال الدفع</span>
                                    <div className="flex-1"></div>

                                    {deposit.screenshot_url && (
                                        <button
                                            onClick={() => setSelectedReceipt(deposit.screenshot_url as string)}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            عرض الإيصال
                                        </button>
                                    )}

                                    {deposit.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusChange(deposit.id, 'approved')}
                                                className="px-4 py-2 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors"
                                            >
                                                ✓ قبول
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(deposit.id, 'rejected')}
                                                className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                            >
                                                ✗ رفض
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-foreground">{deposits.length}</p>
                    <p className="text-muted-foreground mt-2">إجمالي الطلبات</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-warning dark:text-yellow-500 text-yellow-600">{deposits.filter(d => d.status === 'pending').length}</p>
                    <p className="text-muted-foreground mt-2">معلقة</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-success">{deposits.filter(d => d.status === 'completed').length}</p>
                    <p className="text-muted-foreground mt-2">مقبولة</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-destructive">{deposits.filter(d => d.status === 'failed').length}</p>
                    <p className="text-muted-foreground mt-2">مرفوضة</p>
                </div>
            </div>
        </div>
    )
}
