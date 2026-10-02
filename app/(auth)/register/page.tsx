'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { registerSchema } from '@/lib/utils/validation'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
    })
    const [errors, setErrors] = useState<{
        email?: string
        password?: string
        confirmPassword?: string
        full_name?: string
        general?: string
    }>({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { signUp, signInWithGoogle } = useAuth()
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setLoading(true)

        // Validation
        const validation = registerSchema.safeParse(formData)
        if (!validation.success) {
            const fieldErrors: any = {}
            validation.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0]] = err.message
                }
            })
            setErrors(fieldErrors)
            setLoading(false)
            return
        }

        const { data, error } = await signUp(formData.email, formData.password, formData.full_name)

        if (error) {
            setErrors({ general: error.message === 'User already registered' ? 'هذا البريد مسجل مسبقاً' : 'حدث خطأ أثناء التسجيل' })
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            router.push('/dashboard')
        }, 2000)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border shadow-sm rounded-xl p-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-foreground">تم إنشاء الحساب بنجاح!</h3>
                        <p className="text-muted-foreground">يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك</p>
                        <p className="text-sm text-warning font-medium">
                            ⚠️ ملاحظة: إذا لم تجد رسالة التفعيل، يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam)
                        </p>
                        <p className="text-sm text-primary animate-pulse mt-4">جاري تحويلك...</p>
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
                            إنشاء حساب جديد
                        </h1>
                        <p className="text-muted-foreground">
                            أدخل بياناتك لإنشاء حساب جديد
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
                                الاسم الكامل
                            </label>
                            <Input
                                id="full_name"
                                name="full_name"
                                type="text"
                                placeholder="أحمد محمد"
                                value={formData.full_name}
                                onChange={handleChange}
                                error={errors.full_name}
                                disabled={loading}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                البريد الإلكتروني
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                                disabled={loading}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                كلمة المرور
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                disabled={loading}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                تأكيد كلمة المرور
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                                disabled={loading}
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                            />
                        </div>

                        {errors.general && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                                {errors.general}
                            </div>
                        )}

                        <Button type="submit" className="w-full py-6 text-lg rounded-xl font-semibold mt-4 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90" loading={loading}>
                            إنشاء الحساب
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border"></span>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-card text-muted-foreground">أو</span>
                            </div>
                        </div>

                        <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full py-6 rounded-xl font-semibold flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800"
                            onClick={async () => {
                                setLoading(true)
                                await signInWithGoogle()
                            }}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            إنشاء حساب باستخدام Google
                        </Button>

                        <p className="text-sm text-center text-muted-foreground mt-6">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline">
                                تسجيل الدخول
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
