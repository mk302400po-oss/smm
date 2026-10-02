'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Globe2, Users, Heart, Eye, MessageCircle, Crown, Share2, Star, ShieldCheck, Zap, Clock } from 'lucide-react'
import { FaInstagram, FaFacebook, FaYoutube, FaTiktok, FaTelegram, FaLinkedin, FaSpotify, FaTwitch } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiKuaishou, SiKick } from 'react-icons/si'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Service {
    id: string
    platform: string
    category: string
    name: string
    description: string | null
    price: number | null
    price_per_1000: number | null
    min_quantity: number
    max_quantity: number
}

const platformsData = [
    {
        id: 'instagram',
        name: 'Instagram',
        icon: <FaInstagram className="w-11 h-11 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-orange-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: <FaFacebook className="w-11 h-11 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: <FaTiktok className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-cyan-500 via-zinc-900 to-pink-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]'
    },
    {
        id: 'twitter',
        name: 'Twitter / X',
        icon: <FaXTwitter className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-zinc-800 to-zinc-950',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(161,161,170,0.4)]'
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: <FaYoutube className="w-11 h-11 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-red-600 via-red-500 to-orange-600',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]'
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: <FaTelegram className="w-11 h-11 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-sky-400 to-blue-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]'
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: <FaLinkedin className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-blue-600 to-blue-800',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]'
    },
    {
        id: 'spotify',
        name: 'Spotify',
        icon: <FaSpotify className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-green-500 to-emerald-700',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]'
    },
    {
        id: 'twitch',
        name: 'Twitch',
        icon: <FaTwitch className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-purple-500 to-indigo-600',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
    },
    {
        id: 'kwai',
        name: 'Kwai',
        icon: <SiKuaishou className="w-11 h-11 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-orange-400 to-red-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]'
    },
    {
        id: 'kick',
        name: 'Kick',
        icon: <SiKick className="w-12 h-12 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-green-400 to-emerald-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]'
    },
    {
        id: 'other',
        name: 'خدمات أخرى',
        icon: <Globe2 className="w-10 h-10 relative z-10" />,
        color: 'text-white',
        bgColor: 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500',
        glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
    },
]

export default function NewOrderPage() {
    const router = useRouter()
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [link, setLink] = useState('')
    const [quantity, setQuantity] = useState('')

    useEffect(() => {
        if (selectedPlatform) {
            loadServices(selectedPlatform)
        } else {
            setServices([])
            setSelectedService(null)
            setSelectedCategory(null)
        }
    }, [selectedPlatform])

    // Auto-select first category when services load
    useEffect(() => {
        if (services.length > 0 && !selectedCategory) {
            const categories = Array.from(new Set(services.map(s => s.category || 'other')))
            if (categories.length > 0) {
                setSelectedCategory(categories[0])
            }
        }
    }, [services, selectedCategory])

    // Auto-select first service when category changes
    useEffect(() => {
        if (selectedCategory && services.length > 0) {
            if (!selectedService || selectedService.category !== selectedCategory) {
                const categoryServices = services.filter(s => (s.category || 'other') === selectedCategory)
                if (categoryServices.length > 0) {
                    setSelectedService(categoryServices[0])
                }
            }
        }
    }, [selectedCategory, services, selectedService])

    const loadServices = async (platform: string) => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data, error: fetchError } = await supabase
                .from('services')
                .select('*')
                .eq('platform', platform)
                .eq('status', 'active')
                .order('category', { ascending: true })

            if (fetchError) throw fetchError
            setServices(data || [])
        } catch (err: any) {
            toast.error('خطأ في تحميل الخدمات: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const calculatePrice = () => {
        if (!selectedService || !quantity) return 0
        const qty = parseInt(quantity)
        if (isNaN(qty)) return 0
        
        if (selectedService.price) {
            return qty * Number(selectedService.price)
        }
        return (qty / 1000) * (Number(selectedService.price_per_1000) || 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedService || !link || !quantity) {
            toast.error('الرجاء ملء جميع الحقول')
            return
        }

        const qty = parseInt(quantity)
        if (isNaN(qty) || qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
            toast.error(`الكمية يجب أن تكون بين ${selectedService.min_quantity} و ${selectedService.max_quantity}`)
            return
        }

        setSubmitting(true)
        try {
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('يجب تسجيل الدخول أولاً')
                setTimeout(() => router.push('/login'), 2000)
                return
            }

            const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('balance')
                .eq('id', user.id)
                .single()

            if (profileError || !profileData) {
                throw new Error('فشل في تحميل بيانات المستخدم')
            }

            const totalPrice = calculatePrice()
            const userBalance = (profileData as any).balance as number

            if (userBalance < totalPrice) {
                toast.error('رصيدك غير كافٍ. الرجاء شحن الرصيد أولاً')
                return
            }

            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: selectedService.id,
                    link,
                    quantity: qty,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'فشل إنشاء الطلب')
            }

            toast.success('تم إنشاء الطلب بنجاح! ✅')
            setTimeout(() => router.push('/orders'), 2000)
        } catch (err: any) {
            toast.error('خطأ: ' + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getCategoryIcon = (category: string) => {
        const lowerCat = category.toLowerCase()
        if (lowerCat.includes('متابع') || lowerCat.includes('follower')) return <Users className="w-5 h-5 text-blue-500" />
        if (lowerCat.includes('اعجاب') || lowerCat.includes('لايك') || lowerCat.includes('like')) return <Heart className="w-5 h-5 text-red-500" />
        if (lowerCat.includes('مشاهد') || lowerCat.includes('view')) return <Eye className="w-5 h-5 text-green-500" />
        if (lowerCat.includes('تعليق') || lowerCat.includes('comment')) return <MessageCircle className="w-5 h-5 text-yellow-500" />
        if (lowerCat.includes('اشتراك') || lowerCat.includes('sub')) return <Crown className="w-5 h-5 text-purple-500" />
        if (lowerCat.includes('شير') || lowerCat.includes('مشارك') || lowerCat.includes('share')) return <Share2 className="w-5 h-5 text-sky-500" />
        return <Star className="w-5 h-5 text-orange-400" />
    }

    const getCategoryName = (category: string) => {
        return category // Just return the category directly since they are already beautifully written in Arabic from the API
    }

    const groupedServices = services.reduce((acc, service) => {
        const category = service.category || 'other'
        if (!acc[category]) acc[category] = []
        acc[category].push(service)
        return acc
    }, {} as Record<string, Service[]>)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl" dir="rtl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 text-foreground">
                    إنشاء طلب جديد 🚀
                </h1>
                <p className="text-muted-foreground text-lg">
                    اختر المنصة والخدمة وأدخل التفاصيل لبدء طلبك
                </p>
            </div>

            <Card className="mb-8 bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        اختر المنصة
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">انقر على المنصة التي تريد زيادة التفاعل عليها</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {platformsData.map((platform) => {
                            const isSelected = selectedPlatform === platform.id;
                            return (
                                        <button
                                            key={platform.id}
                                            onClick={() => {
                                                setSelectedPlatform(platform.id)
                                                setSelectedCategory(null)
                                                setSelectedService(null)
                                                setLink('')
                                                setQuantity('')
                                            }}
                                            className={`group relative flex flex-col items-center p-5 rounded-[2rem] transition-all duration-300 border-2 overflow-hidden
                                                ${isSelected
                                                    ? `border-transparent bg-white/5 scale-[1.02] shadow-xl`
                                                    : 'border-white/5 bg-black/20 hover:bg-white/[0.03] hover:border-white/10 hover:-translate-y-1'
                                                }`}
                                        >
                                    {/* Selection Glow Effect */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                    )}
                                    {isSelected && (
                                        <div className={`absolute inset-0 opacity-20 ${platform.bgColor} blur-2xl transition-opacity duration-300 pointer-events-none`} />
                                    )}

                                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-300 ${platform.bgColor} ${(platform as any).glowColor} ${isSelected ? 'scale-110 shadow-xl' : 'scale-100 shadow-md'}`}>
                                        <div className="absolute inset-0 rounded-2xl bg-black/10 mix-blend-overlay" />
                                        <div className={`relative z-10 ${platform.color} drop-shadow-md`}>
                                            {platform.icon}
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm md:text-base transition-colors duration-300 z-10 ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                        {platform.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {selectedPlatform && (
                <Card className="mb-8 bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            اختر الخدمة
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">اختر نوع الخدمة التي تريدها</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                                <p className="mt-4 text-muted-foreground">جاري تحميل الخدمات...</p>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground text-lg">لا توجد خدمات متاحة لهذه المنصة</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Category Select */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">الفئة</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full appearance-none bg-background border-2 border-border text-foreground font-semibold rounded-xl p-4 pr-4 pl-10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                            value={selectedCategory || ''}
                                            onChange={(e) => {
                                                const newCategory = e.target.value
                                                setSelectedCategory(newCategory)
                                                // Auto-select first service in this category immediately
                                                const categoryServices = groupedServices[newCategory] || []
                                                if (categoryServices.length > 0) {
                                                    setSelectedService(categoryServices[0])
                                                } else {
                                                    setSelectedService(null)
                                                }
                                                setQuantity('')
                                                setLink('')
                                            }}
                                        >
                                            <option value="" disabled>اختر الفئة...</option>
                                            {Object.keys(groupedServices).map(cat => (
                                                <option key={cat} value={cat}>{getCategoryName(cat)}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Service Select */}
                                {selectedCategory && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="block text-sm font-medium mb-2 text-foreground">الخدمة</label>
                                        <div className="relative">
                                            <select
                                                className="w-full appearance-none bg-background border-2 border-border text-foreground font-semibold rounded-xl p-4 pr-4 pl-10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                                value={selectedService?.id || ''}
                                                onChange={(e) => {
                                                    const svc = groupedServices[selectedCategory].find(s => s.id === e.target.value)
                                                    setSelectedService(svc || null)
                                                }}
                                            >
                                                <option value="" disabled>اختر الخدمة...</option>
                                                {(groupedServices[selectedCategory] || []).map(svc => (
                                                    <option key={svc.id} value={svc.id}>
                                                        {svc.name.replace(/\[(.*?)\]/g, '').trim() || svc.name} — {svc.price ? `$${(Number(svc.price) || 0).toFixed(2)}` : `$${(Number(svc.price_per_1000) || 0).toFixed(2)}/1K`}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Selected Service Info Box (Description) */}
                                {selectedService && selectedService.description && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 mt-6">
                                        <label className="block text-sm font-medium mb-2 text-foreground text-right">الوصف</label>
                                        <div className="bg-[#2b2b36] rounded-xl p-5 text-sm md:text-base text-zinc-300 leading-loose whitespace-pre-line border border-white/5 text-right font-medium">
                                            {selectedService.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {selectedService && (
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            تفاصيل الطلب
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">أدخل الرابط والكمية المطلوبة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-accent/50 p-6 rounded-xl border border-border">
                                <h4 className="font-bold text-lg mb-4 text-foreground">{selectedService.name}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">السعر</p>
                                        <p className="font-bold text-primary">
                                            {selectedService.price ? `$${(Number(selectedService.price) || 0).toFixed(2)}` : `$${(Number(selectedService.price_per_1000) || 0).toFixed(2)}/1K`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">الحد الأدنى</p>
                                        <p className="font-bold text-foreground">{selectedService.min_quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">الحد الأقصى</p>
                                        <p className="font-bold text-foreground">{selectedService.max_quantity.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">المنصة</p>
                                        <p className="font-bold text-foreground capitalize">{selectedService.platform}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="link" className="block text-sm font-medium mb-2 text-foreground">الرابط / الحساب *</label>
                                <Input id="link" type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="أدخل الرابط، اسم المستخدم، أو الرقم" required dir="ltr" className="bg-background border-input text-foreground focus:border-primary focus:ring-primary/20" />
                                <p className="text-sm text-muted-foreground mt-1">أدخل رابط البروفايل، المنشور، أو البيانات المطلوبة في وصف الخدمة</p>
                            </div>

                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-foreground">الكمية *</label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min={selectedService.min_quantity}
                                    max={selectedService.max_quantity}
                                    placeholder={`من ${selectedService.min_quantity} إلى ${selectedService.max_quantity}`}
                                    required
                                    className="bg-background border-input text-foreground focus:border-primary focus:ring-primary/20"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    الكمية يجب أن تكون بين {selectedService.min_quantity} و {selectedService.max_quantity.toLocaleString()}
                                </p>
                            </div>

                            {quantity && (
                                <div className="bg-success/10 p-6 rounded-xl border border-success/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-foreground text-lg">السعر الإجمالي:</span>
                                        <span className="text-3xl font-bold text-success">${calculatePrice().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedPlatform(null)
                                        setSelectedService(null)
                                        setLink('')
                                        setQuantity('')
                                    }}
                                    className="flex-1 font-semibold"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 font-semibold"
                                >
                                    {submitting ? 'جاري الإرسال...' : 'إنشاء الطلب 🚀'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
