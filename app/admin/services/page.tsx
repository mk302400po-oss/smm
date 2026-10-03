'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminServicesPage() {
    const { user, loading } = useAuth()
    const supabase = createClient()
    const [services, setServices] = useState<any[]>([])
    const [isLoadingServices, setIsLoadingServices] = useState(true)

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<any>(null)
    const [deletingService, setDeletingService] = useState<any>(null)
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        platform: 'instagram',
        category: 'followers',
        price: '',
        pricingType: 'per_1000', // 'per_1000' or 'fixed'
        status: 'active',
        min_quantity: '1000',
        max_quantity: '10000'
    })

    const [activeTab, setActiveTab] = useState('local')
    const [externalServices, setExternalServices] = useState<any[]>([])
    const [isLoadingExternal, setIsLoadingExternal] = useState(false)
    const [bulkAmount, setBulkAmount] = useState('')
    const [bulkType, setBulkType] = useState<'percent' | 'fixed'>('percent')

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setServices(data || [])
        } catch (error) {
            console.error('Error fetching services:', error)
        } finally {
            setIsLoadingServices(false)
        }
    }

    const fetchExternalServices = async () => {
        setIsLoadingExternal(true)
        try {
            const response = await fetch('/api/services/external')
            const data = await response.json()
            if (data.error) throw new Error(data.error)
            setExternalServices(data)
        } catch (error) {
            console.error('Error fetching external services:', error)
            alert('فشل جلب الخدمات الخارجية')
        } finally {
            setIsLoadingExternal(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            platform: 'instagram',
            category: 'followers',
            price: '',
            pricingType: 'per_1000',
            status: 'active',
            min_quantity: '1000',
            max_quantity: '10000'
        })
        setEditingService(null)
        setIsAddModalOpen(false)
    }

    const detectPlatform = (name: string, category: string = '') => {
        const str = (name + ' ' + category).toLowerCase()
        if (str.includes('instagram') || str.includes('انستقرام') || str.includes('انستا') || str.includes('انستجرام') || str.includes('threads') || str.includes('ثريدز')) return 'instagram'
        if (str.includes('tiktok') || str.includes('تيك توك') || str.includes('تيكتوك')) return 'tiktok'
        if (str.includes('youtube') || str.includes('يوتيوب')) return 'youtube'
        if (str.includes('facebook') || str.includes('فيسبوك') || str.includes('فيس بوك')) return 'facebook'
        if (str.includes('twitter') || str.includes('تويتر') || str.includes('اكس') || str.match(/\bx\b/)) return 'twitter'
        if (str.includes('telegram') || str.includes('تيليجرام') || str.includes('تليجرام') || str.includes('تليغرام') || str.includes('تلجرام') || str.includes('تيلجرام')) return 'telegram'
        if (str.includes('linkedin') || str.includes('لينكد ان') || str.includes('لينكدإن') || str.includes('لينكد') || str.includes('لينكدان')) return 'linkedin'
        if (str.includes('spotify') || str.includes('سبوتيفاي') || str.includes('سبوتيفاى')) return 'spotify'
        if (str.includes('twitch') || str.includes('تويتش')) return 'twitch'
        if (str.includes('kwai') || str.includes('كواي') || str.includes('كواى')) return 'kwai'
        if (str.includes('kick') || str.includes('كيك')) return 'kick'
        return 'other'
    }

    const formatPrice = (price: number) => {
        // Remove trailing zeros: $0.0665 instead of $0.0665000
        return parseFloat(price.toFixed(4)).toString()
    }

    // ... (existing code)

    const handleEditClick = (service: any) => {
        setEditingService(service)
        setIsAddModalOpen(true)
        setFormData({
            name: service.name,
            platform: service.platform,
            category: service.category || 'followers',
            price: (service.price_per_1000 || service.price || 0).toString(),
            pricingType: service.price ? 'fixed' : 'per_1000',
            status: service.status,
            min_quantity: (service.min_quantity || 1000).toString(),
            max_quantity: (service.max_quantity || 10000).toString()
        })
    }

    const handleDeleteClick = (service: any) => {
        setDeletingService(service)
    }

    const confirmDelete = async () => {
        console.log('🗑️ Attempting to delete service:', deletingService)
        try {
            const { data, error } = await supabase
                .from('services')
                .delete()
                .eq('id', deletingService.id)

            console.log('Delete response:', { data, error })

            if (error) {
                console.error('Delete error details:', error)
                throw error
            }

            console.log('✅ Delete successful, refreshing services...')
            await fetchServices()
            setDeletingService(null)
        } catch (error) {
            console.error('❌ Error deleting service:', error)
            alert('حدث خطأ أثناء حذف الخدمة: ' + (error as any)?.message)
        }
    }

    const handleSave = async () => {
        if (!formData.name || !formData.price) return

        // Validation for Followers
        const minQty = parseInt(formData.min_quantity) || 0
        if (formData.category === 'followers' && minQty < 1000) {
            alert('خطأ: الحد الأدنى للمتابعين يجب أن يكون 1000 أو أكثر')
            return
        }

        const priceValue = parseFloat(formData.price)
        const maxQty = parseInt(formData.max_quantity) || 10000

        // Prepare payload based on pricing type
        const payload: Record<string, any> = {
            name: formData.name,
            platform: formData.platform,
            category: formData.category,
            status: formData.status,
            min_quantity: minQty,
            max_quantity: maxQty
        }

        if (formData.pricingType === 'fixed') {
            payload.price = priceValue
            payload.price_per_1000 = null
        } else {
            payload.price_per_1000 = priceValue
            payload.price = null
        }

        try {
            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    // @ts-ignore - Supabase types not fully generated
                    .update(payload)
                    .eq('id', editingService.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('services')
                    // @ts-ignore - Supabase types not fully generated
                    .insert([payload])
                if (error) throw error
            }

            // Refresh services from database
            await fetchServices()
            resetForm()
        } catch (error) {
            console.error('Error saving service:', error)
            alert('حدث خطأ أثناء حفظ الخدمة')
        }
    }

    // ...

    const handleImportService = async (extService: any) => {
        try {
            // Detect if it's a package or fixed price item
            const isPackage = extService.type === 'package' || extService.max <= 1 || extService.min === extService.max

            const payload: any = {
                name: extService.name,
                platform: detectPlatform(extService.name, extService.category),
                category: extService.category || 'followers',
                min_quantity: extService.min,
                max_quantity: extService.max,
                status: 'active',
                provider_service_id: extService.service
            }

            if (isPackage) {
                payload.price = parseFloat(extService.rate)
                payload.price_per_1000 = null
            } else {
                payload.price_per_1000 = parseFloat(extService.rate)
                payload.price = null
            }

            const { error } = await supabase
                .from('services')
                // @ts-ignore - Supabase types not fully generated
                .insert([payload])

            if (error) throw error
            // ...
        } catch (error) {
            console.error('Error importing service:', error)
            alert('حدث خطأ أثناء استيراد الخدمة')
        }
    }

    const handleImportAll = async () => {
        try {
            const res = await fetch('/api/admin/services/sync', { method: 'POST' })
            const data = await res.json()
            
            if (!res.ok) throw new Error(data.error || 'Failed to sync')
                
            alert(`تم المزامنة بنجاح! تم تحديث ${data.updated} خدمة وإضافة ${data.inserted} خدمة جديدة 🚀`)
            await fetchServices()
            setActiveTab('local')
        } catch (error) {
            console.error('Error importing services:', error)
            alert('حدث خطأ أثناء استيراد الخدمات: ' + (error as any)?.message)
        }
    }



    const [isBulkUpdating, setIsBulkUpdating] = useState(false)

    const handleBulkUpdate = async () => {
        if (!bulkAmount) return
        const amount = parseFloat(bulkAmount)
        if (isNaN(amount)) return

        setIsBulkUpdating(true)
        try {
            // Use database function for fast bulk update (1 query instead of 808!)
            // @ts-ignore - Supabase RPC types not fully generated
            const response = await supabase.rpc('bulk_update_prices', {
                adjustment_amount: amount,
                adjustment_type: bulkType
            })

            const { data, error } = response as unknown as {
                data: Array<{ updated_count: number }> | null
                error: any
            }

            if (error) {
                console.error('Bulk update error:', error)
                throw error
            }

            // Refresh services from database
            await fetchServices()
            setBulkAmount('')

            const updatedCount = data?.[0]?.updated_count || 0
            alert(`تم تحديث ${updatedCount} خدمة بنجاح! 🚀`)
        } catch (error) {
            console.error('Error updating prices:', error)
            alert('حدث خطأ أثناء تحديث الأسعار: ' + JSON.stringify(error))
        } finally {
            setIsBulkUpdating(false)
        }
    }

    const handleBulkDelete = async () => {
        try {
            // Delete all services from database
            const { error } = await supabase
                .from('services')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (dummy condition to match all)

            if (error) throw error

            // Refresh services
            await fetchServices()
            setShowBulkDeleteConfirm(false)
            alert('تم حذف جميع الخدمات بنجاح! ✅')
        } catch (error) {
            console.error('Error deleting all services:', error)
            alert('حدث خطأ أثناء حذف الخدمات')
        }
    }

    return (
        <div className="space-y-6 relative">
            {/* Add/Edit Modal */}
            {deletingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeletingService(null)}>
                    <div className="bg-card border border-border shadow-lg p-6 rounded-xl max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-foreground mb-2">هل أنت متأكد؟</h3>
                        <p className="text-muted-foreground mb-6">سيتم حذف خدمة <span className="text-foreground font-bold">{deletingService.name}</span> نهائياً.</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => setDeletingService(null)} className="px-4 py-2 text-muted-foreground hover:text-foreground">إلغاء</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:opacity-90">حذف نهائي</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBulkDeleteConfirm(false)}>
                    <div className="bg-card border border-border shadow-lg p-6 rounded-xl max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-6xl mb-4">🗑️</div>
                        <h3 className="text-2xl font-bold text-destructive mb-2">⚠️ تحذير خطير!</h3>
                        <p className="text-foreground font-bold mb-2">سيتم حذف جميع الخدمات ({services.length} خدمة)</p>
                        <p className="text-muted-foreground mb-6">هذا الإجراء لا يمكن التراجع عنه!</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => setShowBulkDeleteConfirm(false)} className="px-6 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">إلغاء</button>
                            <button onClick={handleBulkDelete} className="px-6 py-2 bg-destructive text-destructive-foreground rounded hover:opacity-90 font-bold">
                                حذف الكل نهائياً
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Service Form Modal */}
            {(isAddModalOpen || editingService) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => resetForm()}>
                    <div className="bg-card border border-border shadow-lg p-6 rounded-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-foreground mb-6">
                            {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'} ✨
                        </h2>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">اسم الخدمة</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                    placeholder="مثال: متابعين انستقرام عالي الجودة"
                                />
                            </div>

                            {/* Platform & Category - Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">المنصة</label>
                                    <select
                                        value={formData.platform}
                                        onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                    >
                                        <option value="instagram">Instagram 📷</option>
                                        <option value="tiktok">TikTok 🎵</option>
                                        <option value="youtube">YouTube ▶️</option>
                                        <option value="facebook">Facebook 👤</option>
                                        <option value="twitter">Twitter 🐦</option>
                                        <option value="other">أخرى 🌐</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">الفئة</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => {
                                            const newCategory = e.target.value
                                            setFormData({
                                                ...formData,
                                                category: newCategory,
                                                min_quantity: newCategory === 'followers' ? '1000' : formData.min_quantity
                                            })
                                        }}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                    >
                                        <option value="followers">متابعين</option>
                                        <option value="likes">إعجاب</option>
                                        <option value="views">مشاهدات</option>
                                        <option value="comments">تعليقات</option>
                                        <option value="other">أخرى</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price & Pricing Type - Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">السعر ($)</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                        placeholder="0.50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">نوع التسعير</label>
                                    <select
                                        value={formData.pricingType}
                                        onChange={e => setFormData({ ...formData, pricingType: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                    >
                                        <option value="per_1000">لكل 1000</option>
                                        <option value="fixed">سعر ثابت</option>
                                    </select>
                                </div>
                            </div>

                            {/* Min & Max Quantity - Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">الحد الأدنى</label>
                                    <input
                                        type="number"
                                        value={formData.min_quantity}
                                        onChange={e => setFormData({ ...formData, min_quantity: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                        placeholder="1000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">الحد الأقصى</label>
                                    <input
                                        type="number"
                                        value={formData.max_quantity}
                                        onChange={e => setFormData({ ...formData, max_quantity: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                        placeholder="10000"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">الحالة</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
                                >
                                    <option value="active">نشط ✓</option>
                                    <option value="inactive">معطل ✗</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium"
                            >
                                {editingService ? 'حفظ التغييرات' : 'إضافة الخدمة'} 🚀
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">إدارة الخدمات 🎯</h1>
                    <p className="text-muted-foreground mt-2">إضافة وتعديل وحذف الخدمات المتاحة</p>
                </div>
                <Link href="/admin" className="bg-primary text-primary-foreground rounded-xl shadow-sm px-6 py-3 font-semibold hover:opacity-90">
                    ← عودة للوحة التحكم
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('local')}
                    className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'local' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    خدماتي
                </button>
                <button
                    onClick={() => {
                        setActiveTab('provider')
                        if (externalServices.length === 0) fetchExternalServices()
                    }}
                    className={`px-4 py-2 border-b-2 transition-colors font-medium ${activeTab === 'provider' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    خدمات المزود 🌐
                </button>
            </div>

            {activeTab === 'local' ? (
                <div className="space-y-6">
                    {/* Bulk Update Section */}
                    <div className="bg-card border border-primary/20 shadow-sm rounded-xl p-6 bg-gradient-to-r from-primary/5 to-accent/50">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <span>⚡</span> تحديث الأسعار الجماعي
                        </h3>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm text-gray-400 block mb-1">قيمة الزيادة</label>
                                <input
                                    type="number"
                                    value={bulkAmount}
                                    onChange={e => setBulkAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                                    placeholder="مثال: 10"
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-sm text-gray-400 block mb-1">النوع</label>
                                <select
                                    value={bulkType}
                                    onChange={e => setBulkType(e.target.value as 'percent' | 'fixed')}
                                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white [&>option]:bg-black [&>option]:text-white"
                                >
                                    <option value="percent">نسبة مئوية (%)</option>
                                    <option value="fixed">مبلغ ثابت ($)</option>
                                </select>
                            </div>
                            <button
                                onClick={handleBulkUpdate}
                                disabled={isBulkUpdating}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 h-[42px] disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                            >
                                {isBulkUpdating ? 'جاري التحديث...' : 'تطبيق الزيادة'}
                            </button>
                        </div>

                        {/* Decrease Section */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-sm text-gray-400 block mb-1">قيمة النقصان</label>
                                    <input
                                        type="number"
                                        value={bulkAmount}
                                        onChange={e => setBulkAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                                        placeholder="مثال: 10"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-sm text-gray-400 block mb-1">النوع</label>
                                    <select
                                        value={bulkType}
                                        onChange={e => setBulkType(e.target.value as 'percent' | 'fixed')}
                                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white [&>option]:bg-black [&>option]:text-white"
                                    >
                                        <option value="percent">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت ($)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!bulkAmount) return
                                        const amount = -Math.abs(parseFloat(bulkAmount))
                                        if (isNaN(amount)) return

                                        setIsBulkUpdating(true)
                                        try {
                                            // @ts-ignore
                                            const response = await supabase.rpc('bulk_update_prices', {
                                                adjustment_amount: amount,
                                                adjustment_type: bulkType
                                            })

                                            const { data, error } = response as unknown as { data: number | null, error: any }

                                            if (error) throw error

                                            const rowCount = data || 0
                                            alert(`تم تطبيق النقصان على ${rowCount} خدمة بنجاح! ✅`)
                                            await fetchServices()
                                        } catch (error) {
                                            console.error('Error applying decrease:', error)
                                            alert('حدث خطأ أثناء تطبيق النقصان')
                                        } finally {
                                            setIsBulkUpdating(false)
                                        }
                                    }}
                                    disabled={isBulkUpdating}
                                    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 h-[42px] disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                                >
                                    {isBulkUpdating ? 'جاري التحديث...' : '↘️ تطبيق النقصان'}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            * سيتم تطبيق التعديلات على جميع الخدمات ({services.length}) فوراً.
                        </p>
                    </div>

                    {/* Bulk Delete Section - Admin Only */}
                    <div className="bg-card border border-destructive/20 shadow-sm rounded-xl p-6 bg-gradient-to-r from-destructive/10 to-orange-500/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                    🗑️ حذف جميع الخدمات
                                </h3>
                                <p className="text-sm text-muted-foreground">احذف جميع الخدمات ({services.length}) من قاعدة البيانات</p>
                            </div>
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                disabled={services.length === 0}
                                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all"
                            >
                                حذف الكل
                            </button>
                        </div>
                        <p className="text-xs text-destructive mt-3">
                            ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
                        </p>
                    </div>

                    <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-foreground">الخدمات الحالية</h2>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-primary text-primary-foreground rounded-xl shadow-sm px-6 py-3 font-semibold hover:opacity-90"
                            >
                                + إضافة خدمة جديدة
                            </button>
                        </div>

                        <div className="space-y-4">
                            {services.map(service => (
                                <div key={service.id} className="bg-background border border-border shadow-sm rounded-xl p-4 flex items-center justify-between hover:scale-[1.01] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">
                                            {service.icon || '🌐'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                                            <p className="text-sm text-muted-foreground">المنصة: {service.platform}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-success">${formatPrice(service.price_per_1000 || service.price || 0)}</p>
                                            <p className={`text-xs ${service.status === 'active' ? 'text-success' : 'text-destructive'}`}>
                                                {service.status === 'active' ? '✓ نشط' : '✗ معطل'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleEditClick(service)}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(service)}
                                            className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-foreground">خدمات المزود (xfollowr)</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleImportAll}
                                className="px-4 py-2 bg-success/10 text-success rounded hover:bg-success/20 transition-colors text-sm font-medium"
                                disabled={externalServices.length === 0}
                            >
                                + استيراد الكل
                            </button>
                            <button
                                onClick={fetchExternalServices}
                                className="text-sm text-primary hover:opacity-80 font-medium"
                                disabled={isLoadingExternal}
                            >
                                {isLoadingExternal ? 'جاري التحديث...' : '🔄 تحديث القائمة'}
                            </button>
                        </div>
                    </div>

                    {isLoadingExternal ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">جاري جلب الخدمات...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-right">
                                        <th className="p-3 text-muted-foreground">ID</th>
                                        <th className="p-3 text-muted-foreground">الخدمة</th>
                                        <th className="p-3 text-muted-foreground">الفئة</th>
                                        <th className="p-3 text-muted-foreground">السعر</th>
                                        <th className="p-3 text-muted-foreground">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {externalServices.map(service => (
                                        <tr key={service.service} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                                            <td className="p-3 font-mono text-muted-foreground">{service.service}</td>
                                            <td className="p-3 max-w-xs truncate text-foreground" title={service.name}>{service.name}</td>
                                            <td className="p-3 text-muted-foreground">{service.category}</td>
                                            <td className="p-3 font-bold text-success">${service.rate}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => handleImportService(service)}
                                                    className="px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors font-medium"
                                                >
                                                    استيراد
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">إحصائيات الخدمات</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background border border-border rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-foreground">{services.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">إجمالي الخدمات</p>
                    </div>
                    <div className="text-center p-4 bg-background border border-border rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-success">{services.filter(s => s.status === 'active').length}</p>
                        <p className="text-sm text-muted-foreground mt-1">خدمات نشطة</p>
                    </div>
                    <div className="text-center p-4 bg-background border border-border rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-destructive">{services.filter(s => s.status === 'inactive').length}</p>
                        <p className="text-sm text-muted-foreground mt-1">خدمات معطلة</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
