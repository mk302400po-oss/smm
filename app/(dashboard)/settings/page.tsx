'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { passwordSchema } from '@/lib/utils/validation'

export default function SettingsPage() {
    const { user, updatePassword } = useAuth()
    const router = useRouter()
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setSuccess('')
        setLoading(true)

        try {
            const { error } = await (supabase
                .from('users') as any)
                .update({ full_name: fullName })
                .eq('id', user?.id || '')

            if (error) throw error

            setSuccess('تم تحديث الملف الشخصي بنجاح')
        } catch (error) {
            setErrors({ profile: 'حدث خطأ أثناء تحديث الملف الشخصي' })
        }
        setLoading(false)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setSuccess('')
        setLoading(true)

        if (newPassword !== confirmPassword) {
            setErrors({ password: 'كلمات المرور غير متطابقة' })
            setLoading(false)
            return
        }

        const validation = passwordSchema.safeParse(newPassword)
        if (!validation.success) {
            setErrors({ password: validation.error.issues[0].message })
            setLoading(false)
            return
        }

        const { error } = await updatePassword(newPassword)

        if (error) {
            setErrors({ password: 'حدث خطأ أثناء تغيير كلمة المرور' })
        } else {
            setSuccess('تم تغيير كلمة المرور بنجاح')
            setNewPassword('')
            setConfirmPassword('')
        }
        setLoading(false)
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
                    <h1 className="text-3xl font-black text-foreground">الإعدادات</h1>
                    <p className="text-muted-foreground">تحديث معلوماتك الشخصية وكلمة المرور</p>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Profile Settings */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">الملف الشخصي</h2>
                            <p className="text-sm text-muted-foreground">تحديث معلوماتك الأساسية</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-accent/50 border-input text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">الاسم الكامل</label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {errors.profile && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                                {errors.profile}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                loading={loading}
                                className="px-6 font-semibold"
                            >
                                حفظ التغييرات
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">الأمان</h2>
                            <p className="text-sm text-muted-foreground">تغيير كلمة المرور الخاصة بك</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">كلمة المرور الجديدة</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">تأكيد كلمة المرور الجديدة</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={errors.password}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                loading={loading}
                                variant="outline"
                                className="font-semibold"
                            >
                                تغيير كلمة المرور
                            </Button>
                        </div>
                    </form>
                </div>

                {success && (
                    <div className="fixed bottom-8 left-8 right-8 md:right-auto md:w-96 p-4 bg-success/10 border border-success/20 text-success rounded-xl shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-medium">{success}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
