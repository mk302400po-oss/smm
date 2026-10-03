// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { formatCurrency, displayAsEGP, convertToUSD, EXCHANGE_RATES } from '@/lib/utils/format'

type User = {
    id: string
    email: string
    role: string
    balance: number
    created_at: string
    full_name?: string
    is_banned?: boolean
    orders_count?: number
}

export default function AdminUsersPage() {
    const { user, loading } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [fundsUser, setFundsUser] = useState<User | null>(null)
    const [amountToAdd, setAmountToAdd] = useState('')
    const [operationType, setOperationType] = useState<'add' | 'subtract'>('add')
    const supabase = createClient()

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers()
        }
    }, [user])

    const fetchUsers = async () => {
        try {
            // Fetch users from the secure admin API (bypasses RLS)
            const res = await fetch('/api/admin/users')
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to fetch users')

            setUsers(data.users || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveUser = async () => {
        if (!editingUser) return

        try {
            const { error } = await supabase
                .from('users')
                .update({ role: editingUser.role })
                .eq('id', editingUser.id)

            if (error) throw error

            setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
            setEditingUser(null)
        } catch (error) {
            console.error('Error updating user:', error)
            alert('حدث خطأ أثناء تحديث المستخدم')
        }
    }

    const handleAddFunds = async () => {
        if (!fundsUser) return

        const egpAmount = parseFloat(amountToAdd)
        if (isNaN(egpAmount) || egpAmount <= 0) {
            alert('الرجاء إدخال مبلغ صحيح')
            return
        }

        // Convert EGP to USD for database storage
        let usdAmount = convertToUSD(egpAmount)

        // If subtracting, make it negative
        if (operationType === 'subtract') {
            // Check if user has enough balance (with small tolerance for floating point)
            const tolerance = 0.0001 // Small tolerance for floating point comparison
            if (fundsUser.balance + tolerance < usdAmount) {
                toast.error('الرصيد غير كافٍ لإجراء عملية الخصم')
                return
            }
            // keep usdAmount positive for secure_deduct_balance
        }

        try {
            let error;
            if (operationType === 'add') {
                const res = await supabase.rpc('increment_balance', {
                    user_id: fundsUser.id,
                    amount: usdAmount
                });
                error = res.error;
            } else {
                const res = await supabase.rpc('secure_deduct_balance', {
                    p_user_id: fundsUser.id,
                    p_amount: usdAmount
                });
                error = res.error;
                if (!error && !res.data) {
                    toast.error('الرصيد غير كافٍ لإجراء عملية الخصم');
                    return;
                }
            }

            if (error) throw error

            // Record the transaction
            await supabase
                .from('transactions')
                .insert({
                    user_id: fundsUser.id,
                    amount_egp: operationType === 'add' ? egpAmount : -egpAmount,
                    amount_usd: usdAmount,
                    type: operationType === 'add' ? 'credit' : 'debit',
                    description: operationType === 'add'
                        ? `إضافة رصيد من الأدمن`
                        : `خصم رصيد من الأدمن`,
                    admin_id: user?.id
                })

            // Refetch from database to get exact values
            await fetchUsers()
            setFundsUser(null)
            setAmountToAdd('')
            setOperationType('add')
            toast.success(operationType === 'add' ? 'تم إضافة الرصيد بنجاح' : 'تم خصم الرصيد بنجاح')
        } catch (error) {
            console.error('Error adding funds:', error)
            toast.error('حدث خطأ أثناء تعديل الرصيد')
        }
    }

    const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
        const action = currentBanStatus ? 'إلغاء حظر' : 'حظر'
        if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return

        try {
            const { error } = await supabase
                .from('users')
                .update({ is_banned: !currentBanStatus })
                .eq('id', userId)

            if (error) throw error

            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_banned: !currentBanStatus } : u
            ))
        } catch (error) {
            console.error('Error banning user:', error)
            alert('حدث خطأ أثناء تحديث حالة المستخدم')
        }
    }

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`هل أنت متأكد من حذف المستخدم: ${userEmail}؟\n⚠️ هذا الإجراء لا يمكن التراجع عنه!`)) return

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)

            if (error) throw error

            setUsers(users.filter(u => u.id !== userId))
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('حدث خطأ أثناء حذف المستخدم')
        }
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
            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditingUser(null)}>
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-foreground mb-4">تعديل المستخدم</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">البريد الإلكتروني</label>
                                <input
                                    type="text"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full bg-accent/50 border border-border rounded p-2 text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">الصلاحية</label>
                                <select
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-muted-foreground hover:text-foreground">إلغاء</button>
                                <button onClick={handleSaveUser} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">حفظ التغييرات</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Funds Modal */}
            {fundsUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setFundsUser(null); setOperationType('add'); }}>
                    <div className="bg-card border border-border shadow-lg rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-foreground mb-4">تعديل الرصيد</h3>
                        <p className="text-muted-foreground mb-2">للمستخدم: <span className="text-foreground font-mono">{fundsUser.email}</span></p>
                        <p className="text-sm text-muted-foreground mb-4">الرصيد الحالي: <span className="text-success font-bold">{displayAsEGP(fundsUser.balance)}</span></p>

                        <div className="space-y-4">
                            {/* Operation Type Selector */}
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">نوع العملية</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOperationType('add')}
                                        className={`px-4 py-3 rounded-lg border-2 transition-all ${operationType === 'add'
                                            ? 'bg-success/20 border-success text-success font-bold'
                                            : 'bg-accent/50 border-border text-muted-foreground hover:border-success/50'
                                            }`}
                                    >
                                        ➕ إضافة رصيد
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOperationType('subtract')}
                                        className={`px-4 py-3 rounded-lg border-2 transition-all ${operationType === 'subtract'
                                            ? 'bg-destructive/20 border-destructive text-destructive font-bold'
                                            : 'bg-accent/50 border-border text-muted-foreground hover:border-destructive/50'
                                            }`}
                                    >
                                        ➖ خصم رصيد
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground block mb-1">المبلغ (ج.م)</label>
                                <input
                                    type="number"
                                    value={amountToAdd}
                                    onChange={e => setAmountToAdd(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full bg-background border border-border rounded p-2 text-foreground text-lg"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    سيتم تحويلها إلى: ${(parseFloat(amountToAdd) / EXCHANGE_RATES.USD_TO_EGP).toFixed(4) || '0.00'}
                                </p>
                            </div>
                            <div className="flex gap-2 justify-end mt-6">
                                <button onClick={() => { setFundsUser(null); setOperationType('add'); }} className="px-4 py-2 text-muted-foreground hover:text-foreground">إلغاء</button>
                                <button
                                    onClick={handleAddFunds}
                                    className={`px-4 py-2 rounded font-semibold ${operationType === 'add'
                                        ? 'bg-success text-success-foreground hover:opacity-90'
                                        : 'bg-destructive text-destructive-foreground hover:opacity-90'
                                        }`}
                                >
                                    {operationType === 'add' ? '✓ تأكيد الإضافة' : '✓ تأكيد الخصم'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين 👥</h1>
                    <p className="text-muted-foreground mt-2">عرض وإدارة حسابات المستخدمين</p>
                </div>
                <Link href="/admin" className="bg-primary text-primary-foreground rounded-xl shadow-sm px-6 py-3 font-semibold hover:opacity-90">
                    ← عودة للوحة التحكم
                </Link>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">قائمة المستخدمين</h2>

                {users.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">لا يوجد مستخدمين</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-right p-4 text-muted-foreground">البريد الإلكتروني</th>
                                    <th className="text-right p-4 text-muted-foreground">الصلاحية</th>
                                    <th className="text-right p-4 text-muted-foreground">الرصيد</th>
                                    <th className="text-right p-4 text-muted-foreground">عدد الطلبات</th>
                                    <th className="text-center p-4 text-muted-foreground">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className={`border-b border-border hover:bg-accent/50 transition-colors ${u.is_banned ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <p className="font-mono text-foreground">{u.email}</p>
                                            {u.is_banned && <span className="text-xs text-destructive">🚫 محظور</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin'
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
                                                }`}>
                                                {u.role === 'admin' ? '⚙️ Admin' : '👤 User'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-success">{displayAsEGP(u.balance)}</p>
                                            <p className="text-xs text-muted-foreground">({formatCurrency(u.balance)})</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-foreground">{u.orders_count || 0} طلب</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors text-sm"
                                                >
                                                    تعديل
                                                </button>
                                                <button
                                                    onClick={() => setFundsUser(u)}
                                                    className="px-3 py-1 bg-success/10 text-success rounded hover:bg-success/20 transition-colors text-sm"
                                                >
                                                    تعديل الرصيد
                                                </button>
                                                <button
                                                    onClick={() => handleBanUser(u.id, u.is_banned || false)}
                                                    className={`px-3 py-1 rounded hover:opacity-80 transition-colors text-sm ${u.is_banned
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-warning/10 text-warning dark:bg-yellow-500/20 dark:text-yellow-500 text-yellow-600 bg-yellow-500/10'
                                                        }`}
                                                >
                                                    {u.is_banned ? '✓ إلغاء الحظر' : '🚫 حظر'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                    className="px-3 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm"
                                                    disabled={u.role === 'admin'}
                                                    title={u.role === 'admin' ? 'لا يمكن حذف المديرين' : 'حذف المستخدم'}
                                                >
                                                    🗑️ حذف
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-foreground">{users.length}</p>
                    <p className="text-muted-foreground mt-2">إجمالي المستخدمين</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-primary">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-muted-foreground mt-2">مديرون</p>
                </div>
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-center">
                    <p className="text-3xl font-bold text-success">{displayAsEGP(users.reduce((sum, u) => sum + u.balance, 0))}</p>
                    <p className="text-xs text-muted-foreground mt-1">({formatCurrency(users.reduce((sum, u) => sum + u.balance, 0))})</p>
                    <p className="text-muted-foreground mt-2">إجمالي الأرصدة</p>
                </div>
            </div>
        </div>
    )
}
