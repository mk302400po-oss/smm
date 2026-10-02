// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

type Transaction = {
    id: string
    amount_egp: number
    amount_usd: number
    type: 'credit' | 'debit'
    description: string
    created_at: string
    order_id?: string
}

export default function TransactionsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
        if (user) {
            fetchTransactions()
        }
    }, [user, loading, router])

    const fetchTransactions = async () => {
        try {
            // Get all transactions
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Filter: show credits OR debits that are orders (have order_id)
            const filtered = (data || []).filter(t =>
                t.type === 'credit' || (t.type === 'debit' && t.order_id)
            )

            setTransactions(filtered)
        } catch (error) {
            // Silent error handling
        } finally {
            setIsLoading(false)
        }
    }

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full w-10 h-10 p-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-foreground">سجل المعاملات 💰</h1>
                    <p className="text-muted-foreground">عرض جميع عمليات شحن الرصيد</p>
                </div>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-card border border-border shadow-sm rounded-xl p-12 text-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">لا توجد معاملات</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        لم تقم بأي عمليات شحن رصيد حتى الآن
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="bg-card border border-border shadow-sm rounded-xl p-6 hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === 'credit'
                                        ? 'bg-success/20 text-success'
                                        : 'bg-destructive/20 text-destructive'
                                        }`}>
                                        {transaction.type === 'credit' ? '➕' : '🛒'}
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">{transaction.description}</p>
                                        <p className="text-sm text-muted-foreground">{formatRelativeTime(transaction.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                                        }`}>
                                        {transaction.type === 'credit' ? '+' : '-'}
                                        {(Math.abs(transaction.amount_egp) || 0).toFixed(2)} ج.م
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ({transaction.type === 'credit' ? '+' : '-'}
                                        {formatCurrency(Math.abs(transaction.amount_usd) || 0)})
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
