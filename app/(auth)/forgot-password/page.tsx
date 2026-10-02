'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emailSchema } from '@/lib/utils/validation'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { resetPassword } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const emailValidation = emailSchema.safeParse(email)
        if (!emailValidation.success) {
            setError(emailValidation.error.issues[0].message)
            setLoading(false)
            return
        }

        const { error: resetError } = await resetPassword(email)

        if (resetError) {
            setError('حدث خطأ أثناء إرسال رابط إعادة التعيين')
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
                        <h3 className="text-3xl font-bold text-foreground">تم إرسال رابط إعادة التعيين</h3>
                        <p className="text-muted-foreground">يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
                        <Button asChild variant="default" className="w-full font-semibold py-6 text-lg rounded-xl mt-4">
                            <Link href="/login">العودة لتسجيل الدخول</Link>
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
                            نسيت كلمة المرور؟
                        </h1>
                        <p className="text-muted-foreground">
                            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error}
                                disabled={loading}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                            />
                        </div>

                        <Button type="submit" className="w-full py-6 text-lg rounded-xl font-semibold" loading={loading}>
                            إرسال رابط إعادة التعيين
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors hover:underline">
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
