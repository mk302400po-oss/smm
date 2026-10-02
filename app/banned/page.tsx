'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import WhatsAppButton from '@/components/WhatsAppButton'

export default function BannedPage() {
    const { signOut } = useAuth()

    const handleReturn = async () => {
        await signOut()
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full">
                <div className="bg-card border border-border shadow-sm rounded-xl p-8 text-center">
                    <div className="text-6xl mb-6">🚫</div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        حسابك محظور
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        تم حظر حسابك من قبل الإدارة. لا يمكنك الوصول إلى الخدمات حالياً.
                    </p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                        <p className="text-destructive text-sm mb-4">
                            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني.
                        </p>
                        <WhatsAppButton
                            message="مرحباً، حسابي محظور وأريد المساعدة"
                            size="md"
                        />
                    </div>
                    <button
                        onClick={handleReturn}
                        className="inline-block px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors mt-4"
                    >
                        تسجيل الخروج والعودة للصفحة الرئيسية
                    </button>
                </div>
            </div>
        </div>
    )
}
