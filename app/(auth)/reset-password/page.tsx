'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { passwordSchema } from '@/lib/utils/validation'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { updatePassword } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة')
            setLoading(false)
            return
        }

        const passwordValidation = passwordSchema.safeParse(password)
        if (!passwordValidation.success) {
            setError(passwordValidation.error.issues[0].message)
            setLoading(false)
            return
        }

        const { error: updateError } = await updatePassword(password)

        if (updateError) {
            setError('حدث خطأ أثناء تحديث كلمة المرور')
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border shadow-sm rounded-xl p-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-foreground">تم تحديث كلمة المرور بنجاح</h3>
                        <p className="text-muted-foreground">يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة</p>
                        <Button asChild variant="default" className="w-full font-semibold py-6 text-lg rounded-xl mt-4">
                            <Link href="/login">تسجيل الدخول</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border shadow-sm rounded-xl p-8">
                    <div className="text-center space-y-2 mb-8">
                        <h1 className="text-3xl font-black text-foreground">
                            كلمة مرور جديدة
                        </h1>
                        <p className="text-muted-foreground">
                            أدخل كلمة المرور الجديدة لحسابك
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={error && error !== 'كلمات المرور غير متطابقة' ? error : undefined}
                                    disabled={loading}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={error === 'كلمات المرور غير متطابقة' ? error : undefined}
                                    disabled={loading}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-destructive text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full py-6 text-lg rounded-xl font-semibold" loading={loading}>
                            تحديث كلمة المرور
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
