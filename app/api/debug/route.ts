import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    
    const { data: services, error } = await supabase.from('services').select('id, name, category, platform')
    
    if (error || !services) return NextResponse.json({ error })

    let updated = 0
    const servicesList = services as any[]
    for (const service of servicesList) {
        const str = (service.name + ' ' + (service.category || '')).toLowerCase()
        let newPlatform = 'other'

        if (str.includes('instagram') || str.includes('انستقرام') || str.includes('انستا') || str.includes('انستجرام') || str.includes('threads') || str.includes('ثريدز')) {
            newPlatform = 'instagram'
        } else if (str.includes('tiktok') || str.includes('تيك توك') || str.includes('تيكتوك')) {
            newPlatform = 'tiktok'
        } else if (str.includes('youtube') || str.includes('يوتيوب')) {
            newPlatform = 'youtube'
        } else if (str.includes('facebook') || str.includes('فيسبوك') || str.includes('فيس بوك')) {
            newPlatform = 'facebook'
        } else if (str.includes('twitter') || str.includes('تويتر') || str.includes('اكس') || str.match(/\bx\b/)) {
            newPlatform = 'twitter'
        } else if (str.includes('telegram') || str.includes('تيليجرام') || str.includes('تليجرام') || str.includes('تليغرام') || str.includes('تلجرام') || str.includes('تيلجرام')) {
            newPlatform = 'telegram'
        } else if (str.includes('linkedin') || str.includes('لينكد ان') || str.includes('لينكدإن') || str.includes('لينكد') || str.includes('لينكدان')) {
            newPlatform = 'linkedin'
        } else if (str.includes('spotify') || str.includes('سبوتيفاي') || str.includes('سبوتيفاى')) {
            newPlatform = 'spotify'
        } else if (str.includes('twitch') || str.includes('تويتش')) {
            newPlatform = 'twitch'
        } else if (str.includes('kwai') || str.includes('كواي') || str.includes('كواى')) {
            newPlatform = 'kwai'
        } else if (str.includes('kick') || str.includes('كيك')) {
            newPlatform = 'kick'
        }

        if (newPlatform !== service.platform) {
            await supabase.from('services').update({ platform: newPlatform }).eq('id', service.id)
            updated++
        }
    }
    
    return NextResponse.json({ message: 'Success', updated })
}
