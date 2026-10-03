'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { EXCHANGE_RATES, updateExchangeRate } from '@/lib/utils/format'

const PAYMENT_METHODS = [
    {
        id: 'binance',
        name: 'Binance USDT [تلقائي]',
        logoUrl: '/logos/binance.png',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 4.2L17.8 12 12 17.8 6.2 12 12 6.2z" />
            </svg>
        ),
        networks: [
            { label: 'شبكة BNB Smart Chain', value: '0x31df56a796daf911bb6296619979f4f414230570' },
            { label: 'شبكة Arbitrum One', value: '0x31df56a796daf911bb6296619979f4f414230570' }
        ],
        details: { label: '', value: '' },
        instructions: '📌 قم بتحويل USDT عبر إحدى الشبكتين الموضحتين أعلاه.\n📌 بعد إتمام التحويل، انسخ "رقم المعاملة" (TxID) وضعه في الأسفل.\n\n⚡ النظام سيقوم بالتأكد وإضافة الرصيد لحسابك في ثوانٍ تلقائياً!',
        color: 'from-yellow-500 to-yellow-700',
        borderColor: 'border-yellow-500/50',
        textColor: 'text-yellow-400',
        isAutoCrypto: true
    },
    {
        id: 'bybit',
        name: 'Bybit USDT [تلقائي]',
        logoUrl: '/logos/bybit.png',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
        ),
        networks: [
            { label: 'شبكة BNB Smart Chain', value: '0x7c26410550815f70f122a95a48d26ce2490e7c44' },
            { label: 'شبكة Arbitrum One', value: '0x7c26410550815f70f122a95a48d26ce2490e7c44' }
        ],
        details: { label: '', value: '' },
        instructions: '📌 قم بتحويل USDT عبر إحدى الشبكتين الموضحتين أعلاه.\n📌 بعد إتمام التحويل، انسخ "رقم المعاملة" (TxID) وضعه في الأسفل.\n\n⚡ النظام سيقوم بالتأكد وإضافة الرصيد لحسابك في ثوانٍ تلقائياً!',
        color: 'from-gray-600 to-gray-800',
        borderColor: 'border-gray-500/50',
        textColor: 'text-gray-400',
        isAutoCrypto: true
    },
    {
        id: 'instapay',
        name: 'Instapay [تلقائي]',
        logoUrl: '/logos/instapay.png',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="35" cy="50" r="20" opacity="0.6" />
                <circle cx="65" cy="50" r="20" opacity="0.8" />
            </svg>
        ),
        details: {
            label: 'عنوان الدفع',
            value: '01550289974'
        },
        color: 'from-purple-600 to-purple-800',
        borderColor: 'border-purple-500/50',
        textColor: 'text-purple-400',
        isAutoCrypto: false,
        hasAutoBadge: true
    },
    {
        id: 'etisalat_cash',
        name: 'اتصالات كاش [تلقائي]',
        logoUrl: '/logos/etisalat.png',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 2H7C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5zm0 18H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3zM12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
            </svg>
        ),
        details: {
            label: 'رقم المحفظة',
            value: '01112182199'
        },
        color: 'from-green-600 to-green-800',
        borderColor: 'border-green-500/50',
        textColor: 'text-green-400',
        isAutoCrypto: false,
        hasAutoBadge: true
    },
    {
        id: 'redotpay',
        name: 'RedotPay',
        logoUrl: '/logos/redotpay.png',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6zm0 4h8v2H6z" />
            </svg>
        ),
        details: {
            label: 'RedotPay ID',
            value: '1590507094'
        },
        instructions: '📌 اكتب الايدي أو حسابك الذي قمت بالتحويل منه لسهولة المراجعة\n📌 اكتب الكمية التى تريدها\n\n⛔ تأكد من رقم الايدي الخاص بك جيداً قبل الطلب ⛔',
        color: 'from-blue-600 to-blue-800',
        borderColor: 'border-blue-500/50',
        textColor: 'text-blue-400',
        isAutoCrypto: false
    }
]

export default function AddFundsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0])
    
    // States for manual flow
    const [amount, setAmount] = useState('')
    const [senderPhone, setSenderPhone] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // States for crypto flow
    const [txId, setTxId] = useState('')
    
    // Shared states
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const supabase = createClient()
    const [rate, setRate] = useState(EXCHANGE_RATES.USD_TO_EGP)

    useEffect(() => {
        updateExchangeRate().then(() => {
            setRate(EXCHANGE_RATES.USD_TO_EGP)
        })
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmitCrypto = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        
        if (!txId || txId.trim() === '') {
            setError('الرجاء إدخال رقم المعاملة (TxID)')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/payments/crypto/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txId: txId.trim(),
                    provider: selectedMethod.id,
                    userId: user?.id
                })
            })
            
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء التحقق من المعاملة')
            }
            
            setSuccess(`تم التحقق بنجاح! تم إضافة ${data.amountUSD} دولار إلى حسابك (${data.amountEGP} ج.م)`)
            setTxId('')
            toast.success('تم شحن رصيدك بنجاح! 🚀')
            
            // Redirect after 3s to refresh balance
            setTimeout(() => {
                router.refresh()
            }, 3000)

        } catch (err: any) {
            console.error('Crypto error:', err)
            setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitManual = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('الرجاء إدخال مبلغ صحيح')
            setLoading(false)
            return
        }

        if (!senderPhone || senderPhone.trim().length < 5) {
            setError('الرجاء إدخال بيانات التحويل (رقم الهاتف أو ID)')
            setLoading(false)
            return
        }

        if (!file) {
            setError('الرجاء إرفاق صورة التحويل')
            setLoading(false)
            return
        }

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}/${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('deposits')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('deposits')
                .getPublicUrl(fileName)

            const { error: depositError } = await supabase
                .from('deposit_requests')
                .insert({
                    user_id: user?.id,
                    amount: Number(amount),
                    payment_method: selectedMethod.id,
                    sender_phone: senderPhone,
                    transaction_id: null,
                    status: 'pending',
                    screenshot_url: publicUrl,
                    created_at: new Date().toISOString()
                } as any)

            if (depositError) throw depositError

            await supabase.from('notifications').insert({
                user_id: user?.id,
                title: 'طلب شحن رصيد',
                message: `تم استلام طلب شحن رصيد بقيمة ${amount} عبر ${selectedMethod.name} وهو قيد المراجعة`,
                type: 'info'
            } as any)

            setSuccess('تم إرسال طلب الشحن بنجاح، سيتم مراجعة الطلب وإضافة الرصيد قريباً')
            setAmount('')
            setSenderPhone('')
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

        } catch (err: any) {
            console.error('Error adding funds:', err)
            setError(err.message || 'حدث خطأ أثناء إرسال الطلب')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full w-10 h-10 p-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-foreground">شحن الرصيد</h1>
                    <p className="text-muted-foreground">اختر طريقة الدفع المناسبة لك</p>
                </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PAYMENT_METHODS.map((method) => (
                    <button
                        key={method.id}
                        onClick={() => {
                            setSelectedMethod(method);
                            setError('');
                            setSuccess('');
                        }}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${selectedMethod.id === method.id
                            ? `${method.borderColor} bg-accent shadow-sm`
                            : 'border-border bg-card hover:border-primary/20 hover:bg-accent'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${method.color} text-white shadow-sm overflow-hidden`}>
                            {method.logoUrl ? (
                                <img src={method.logoUrl} alt={method.name} className="w-full h-full object-contain bg-white p-2" />
                            ) : (
                                method.icon
                            )}
                        </div>
                        <span className={`font-bold ${selectedMethod.id === method.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {method.name}
                        </span>
                        {selectedMethod.id === method.id && (
                            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-success shadow-sm"></div>
                        )}
                        {(method.isAutoCrypto || method.hasAutoBadge) && (
                            <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-success/20 text-success uppercase">Auto</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Instructions Card */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8 h-fit relative overflow-hidden">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
                        <span className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center ${selectedMethod.textColor}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        تعليمات {selectedMethod.name}
                    </h2>

                    <div className="space-y-6 text-muted-foreground relative z-10">
                        {selectedMethod.networks ? (
                            <div className="space-y-4">
                                {selectedMethod.networks.map((net, idx) => (
                                    <div key={idx} className="p-6 rounded-xl bg-background border border-border text-center">
                                        <p className="text-sm text-muted-foreground mb-2">{net.label}</p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                                            <p className="text-xl md:text-2xl font-mono font-bold text-foreground tracking-wider break-all max-w-[280px] md:max-w-none">{net.value}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`p-2 h-auto ${selectedMethod.textColor} hover:bg-accent rounded-lg flex-shrink-0`}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(net.value)
                                                    toast.success('تم النسخ بنجاح!')
                                                }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 rounded-xl bg-background border border-border text-center">
                                <p className="text-sm text-muted-foreground mb-2">{selectedMethod.details.label}</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                                    <p className="text-xl md:text-2xl font-mono font-bold text-foreground tracking-wider break-all max-w-[280px] md:max-w-none">{selectedMethod.details.value}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`p-2 h-auto ${selectedMethod.textColor} hover:bg-accent rounded-lg flex-shrink-0`}
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedMethod.details.value)
                                            toast.success('تم النسخ بنجاح!')
                                        }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!selectedMethod.isAutoCrypto && (
                            <ul className="space-y-4 text-sm">
                                <li className="flex gap-3 items-start">
                                    <span className={`w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedMethod.textColor}`}>1</span>
                                    <p>قم بتحويل المبلغ المراد شحنه إلى {selectedMethod.details.label} الموضح أعلاه.</p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className={`w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedMethod.textColor}`}>2</span>
                                    <p>احتفظ بلقطة شاشة (Screenshot) واضحة لعملية التحويل تثبت إتمام العملية.</p>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <span className={`w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedMethod.textColor}`}>3</span>
                                    <p>أدخل المبلغ الذي قمت بتحويله وأرفق الصورة في النموذج المقابل.</p>
                                </li>
                            </ul>
                        )}

                        {selectedMethod.instructions && (
                            <div className={`mt-6 p-4 rounded-lg border ${selectedMethod.borderColor} bg-background`}>
                                <div className="flex items-start gap-3">
                                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedMethod.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className={`text-sm font-semibold leading-relaxed whitespace-pre-line ${selectedMethod.textColor}`}>
                                        {selectedMethod.instructions}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center ${selectedMethod.textColor}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </span>
                        بيانات التحويل
                    </h2>

                    {selectedMethod.isAutoCrypto ? (
                        /* AUTO CRYPTO FORM */
                        <form onSubmit={handleSubmitCrypto} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    رقم المعاملة (TxID / Transaction Hash)
                                    <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="أدخل الـ TxID هنا..."
                                    value={txId}
                                    onChange={(e) => setTxId(e.target.value)}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 text-lg font-mono"
                                    dir="ltr"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    بمجرد وضعك لرقم المعاملة هنا، سيبحث النظام عنه في شبكتنا ويضيف الرصيد تلقائياً. تأكد من أن التحويل قد اكتمل من طرفك (Completed).
                                </p>
                            </div>
                            
                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {success}
                                </div>
                            )}

                            <Button
                                type="submit"
                                loading={loading}
                                className={`w-full text-white py-6 text-lg font-bold bg-gradient-to-r ${selectedMethod.color} hover:opacity-90 transition-opacity flex gap-2 items-center justify-center`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                تحقق وإضافة الرصيد
                            </Button>
                        </form>
                    ) : (
                        /* MANUAL FORM (CASH) */
                        <form onSubmit={handleSubmitManual} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center justify-between w-full">
                                    المبلغ المحول (ج.م)
                                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                        سعر الصرف: 1$ = {rate.toFixed(2)} ج.م
                                    </span>
                                </label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 text-lg"
                                    disabled={loading}
                                />
                                {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        سوف تحصل على: <span className="font-bold text-success">${(Number(amount) / rate).toFixed(2)}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    بيانات المحول (رقم الهاتف أو ID)
                                    <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="01xxxxxxxxx / ID..."
                                    value={senderPhone}
                                    onChange={(e) => setSenderPhone(e.target.value)}
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 text-lg font-mono"
                                    dir="ltr"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">أدخل رقم الهاتف الذي حولت منه المبلغ أو حسابك</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    صورة التحويل
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        className="hidden"
                                        id="file-upload"
                                        disabled={loading}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${file
                                            ? 'border-success/50 bg-success/10'
                                            : 'border-border bg-background hover:bg-accent hover:border-primary/50'
                                            }`}
                                    >
                                        {file ? (
                                            <div className="text-center text-success">
                                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">اضغط لرفع الصورة</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {success}
                                </div>
                            )}

                            <Button
                                type="submit"
                                loading={loading}
                                className={`w-full text-white py-6 text-lg font-bold bg-gradient-to-r ${selectedMethod.color} hover:opacity-90 transition-opacity`}
                            >
                                إرسال طلب الشحن
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
